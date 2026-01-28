import { PaymentModeList } from "@/components/payment-modes/payment-mode-list"

export default function PaymentModesPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-10 pt-5">
            <PaymentModeList />
        </div>
    )
}
