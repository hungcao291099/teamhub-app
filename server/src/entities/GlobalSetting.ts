import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity("global_setting")
export class GlobalSetting {
    @PrimaryColumn()
    key: string

    @Column()
    value: string
}
