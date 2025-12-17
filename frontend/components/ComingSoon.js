import React from 'react';
import DashboardLayout from './DashboardLayout';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/router';

const ComingSoon = ({ title = "Coming Soon", description = "We are working hard to bring you this feature. Stay tuned!" }) => {
    const router = useRouter();

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-primary/5 p-6 rounded-full mb-6">
                    <Construction className="h-16 w-16 text-primary animate-pulse" />
                </div>

                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
                    {title}
                </h1>

                <p className="text-xl text-muted-foreground max-w-md mb-8">
                    {description}
                </p>

                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </div>
        </DashboardLayout>
    );
};

export default ComingSoon;
