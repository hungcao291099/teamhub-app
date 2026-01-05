import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/services/api";
import { getLogs, AutoCheckInLog } from "@/services/logService";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw, Terminal, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const pageAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export function LogConsolePage() {
    const [logs, setLogs] = useState<AutoCheckInLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [autoMode, setAutoMode] = useState(true);
    const [updatingAutoMode, setUpdatingAutoMode] = useState(false);
    const consoleRef = useRef<HTMLDivElement>(null);

    const fetchAutoModeConfig = async () => {
        try {
            const response = await api.get("/settings/auto-checkin");
            setAutoMode(response.data.enabled);
        } catch (err) {
            console.error("Failed to fetch auto mode config", err);
        }
    };

    const toggleAutoMode = async (enabled: boolean) => {
        setUpdatingAutoMode(true);
        try {
            await api.post("/settings/auto-checkin", { enabled });
            setAutoMode(enabled);
            toast.success(`Đã ${enabled ? "bật" : "tắt"} chế độ Auto`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không thể cập nhật cấu hình");
        } finally {
            setUpdatingAutoMode(false);
        }
    };

    const fetchLogs = async () => {
        try {
            setError(null);
            const data = await getLogs(200);
            setLogs(data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải logs");
        } finally {
            setLoading(false);
        }
    };

    const testWebhook = async () => {
        setTestingWebhook(true);
        try {
            await api.post("/hrm/test-webhook");
            toast.success("Đã gửi test notification đến Discord!");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Không thể gửi test webhook");
        } finally {
            setTestingWebhook(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchAutoModeConfig();
    }, []);

    // Auto refresh every 30 seconds if autoMode is enabled
    useEffect(() => {
        if (!autoMode) return;
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [autoMode]);

    // Auto scroll to bottom on new logs
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        return status === "SUCCESS" ? "text-green-400" : "text-red-400";
    };

    const getActionColor = (action: string) => {
        return action === "CHECK_IN" ? "text-cyan-400" : "text-yellow-400";
    };

    return (
        <motion.div
            variants={pageAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Terminal className="h-8 w-8" />
                    Auto Check-in Logs
                </h1>
                <div className="flex items-center gap-6">
                    <Switch
                        label="Chế độ Auto (Chấm công & Refresh)"
                        checked={autoMode}
                        onCheckedChange={toggleAutoMode}
                        disabled={updatingAutoMode}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={testWebhook}
                        disabled={testingWebhook}
                    >
                        <Send className={`h-4 w-4 mr-2 ${testingWebhook ? "animate-pulse" : ""}`} />
                        Test Discord
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLogs}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="py-3 border-b border-gray-700">
                    <CardTitle className="text-sm font-mono text-gray-400">
                        console@teamhub:~$ tail -f auto_checkin.log
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div
                        ref={consoleRef}
                        className="font-mono text-sm h-[600px] overflow-y-auto p-4 bg-gray-950"
                    >
                        {error && (
                            <div className="text-red-500 mb-4">
                                [ERROR] {error}
                            </div>
                        )}

                        {loading && logs.length === 0 && (
                            <div className="text-gray-500">
                                Loading logs...
                            </div>
                        )}

                        {logs.length === 0 && !loading && !error && (
                            <div className="text-gray-500">
                                Chưa có log nào. Scheduler đang chạy và sẽ ghi log khi đến giờ chấm công.
                            </div>
                        )}

                        {/* Display logs in reverse order (oldest first) */}
                        {[...logs].reverse().map((log) => (
                            <div key={log.id} className="mb-2 leading-relaxed">
                                <span className="text-gray-500">[{formatDate(log.createdAt)}]</span>{" "}
                                <span className={getStatusColor(log.status)}>[{log.status}]</span>{" "}
                                <span className={getActionColor(log.action)}>{log.action}</span>{" "}
                                <span className="text-purple-400">@{log.username}</span>{" "}
                                <span className="text-gray-400">|</span>{" "}
                                <span className="text-blue-400">{log.shiftCode}</span>{" "}
                                <span className="text-gray-400">
                                    (scheduled: {log.scheduledTime}, actual: {log.actualTime})
                                </span>
                                {log.status === "FAILED" && log.response && (
                                    <div className="text-red-400 ml-4 text-xs">
                                        └─ {JSON.parse(log.response).error || log.response}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Blinking cursor */}
                        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse" />
                    </div>
                </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
                <p>
                    <strong>Scheduler:</strong> Chạy mỗi phút, kiểm tra tất cả user có tokenA
                </p>
                <p>
                    <strong>Time parsing:</strong> "7h30-11h30, 13h-17h" → Check-in: 7:30, 13:00 | Check-out: 11:30, 17:00
                </p>
                <p>
                    <strong>Random offset:</strong> ±10 phút (khác nhau cho mỗi user mỗi ngày)
                </p>
            </div>
        </motion.div>
    );
}
