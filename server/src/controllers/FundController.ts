import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { FundTransaction } from "../entities/FundTransaction";

class FundController {
    static list = async (req: Request, res: Response) => {
        const repo = AppDataSource.getRepository(FundTransaction);
        try {
            const transactions = await repo.find({
                order: { timestamp: "DESC" }
            });
            res.send(transactions);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    static getSummary = async (req: Request, res: Response) => {
        // Calculate current balance from latest transaction
        const repo = AppDataSource.getRepository(FundTransaction);
        try {
            const latest = await repo.findOne({
                order: { timestamp: "DESC" },
                where: {}
            });
            res.send({ currentBalance: latest ? latest.balanceAfter : 0 });
        } catch (error) {
            res.status(500).send(error);
        }
    };

    static add = async (req: Request, res: Response) => {
        const { type, amount, description, timestamp } = req.body;
        const repo = AppDataSource.getRepository(FundTransaction);

        // This transaction logic needs to be safe. 
        // In SQL we can use a transaction or simple logic if low concurrency.
        // Logic: Get latest balance -> calc new balance -> insert.

        await AppDataSource.transaction(async transactionalEntityManager => {
            const latest = await transactionalEntityManager.findOne(FundTransaction, {
                order: { timestamp: "DESC" },
                where: {}
            });
            const currentBalance = latest ? Number(latest.balanceAfter) : 0;
            const newBalance = type === "thu" ? currentBalance + Number(amount) : currentBalance - Number(amount);

            const tx = new FundTransaction();
            tx.type = type;
            tx.amount = Number(amount);
            tx.description = description;
            tx.timestamp = timestamp ? new Date(timestamp) : new Date();
            tx.balanceAfter = newBalance;

            await transactionalEntityManager.save(tx);

            // Emit socket event
            const { getIO } = require("../socket");
            try {
                const io = getIO();
                io.emit("fund:updated"); // Refresh list
                io.emit("fund:transaction_added", tx); // Trigger overlay
            } catch (e) { console.log("Socket not ready"); }

            res.status(201).send(tx);
        });
    };

    static delete = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const repo = AppDataSource.getRepository(FundTransaction);

        await AppDataSource.transaction(async manager => {
            const txToDelete = await manager.findOne(FundTransaction, { where: { id } });
            if (!txToDelete) {
                res.status(404).send("Transaction not found");
                return;
            }

            const adjustment = txToDelete.type === "thu" ? -Number(txToDelete.amount) : Number(txToDelete.amount);

            // Update all subsequent transactions
            await manager
                .createQueryBuilder()
                .update(FundTransaction)
                .set({ balanceAfter: () => `balanceAfter + ${adjustment}` })
                .where("timestamp > :data", { data: txToDelete.timestamp })
                .execute();

            await manager.remove(txToDelete);

            // Emit socket event
            const { getIO } = require("../socket");
            try {
                const io = getIO();
                io.emit("fund:updated");
            } catch (e) { console.log("Socket not ready"); }

            res.status(204).send();
        });
    };
}
export default FundController;
