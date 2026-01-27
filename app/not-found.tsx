import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="animate-in fade-in zoom-in duration-500 rounded-full bg-muted p-6 mb-6">
                <FileQuestion className="h-16 w-16 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2 text-foreground">
                404
            </h1>
            <h2 className="text-2xl font-semibold tracking-tight mb-4 text-muted-foreground">
                Page Not Found
            </h2>
            <p className="text-muted-foreground max-w-[500px] mb-8 leading-relaxed">
                Oops! The page you're looking for doesn't exist. It might have been
                moved, deleted, or you might have typed the URL incorrectly.
            </p>
            <Link href="/" tabIndex={-1}>
                <Button size="lg" className="gap-2 font-semibold">
                    Back to Home
                </Button>
            </Link>
        </div>
    );
}
