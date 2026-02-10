import { BankList } from "@/components/bank-details/bank-list"

export default function BankDetailsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                {/* <h1 className="text-2xl font-bold tracking-tight">Bank Details</h1> */}
            </div>
            <BankList />
        </div>
    )
}
