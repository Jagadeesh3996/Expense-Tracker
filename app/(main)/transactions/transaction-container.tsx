"use client"

import { TransactionForm } from "@/components/transaction/transaction-form"
import { TransactionList } from "@/components/transaction/transaction-list"
import { useState } from "react"

interface TransactionContainerProps {
    initialData: any[]
    initialCount: number
}

export function TransactionContainer({ initialData, initialCount }: TransactionContainerProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    return (
        <>
            <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight px-1">New Transaction</h2>
                <TransactionForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            </div>
            <TransactionList
                refreshTrigger={refreshTrigger}
                defaultLimit={10}
                initialData={initialData}
                initialCount={initialCount}
            />
        </>
    )
}
