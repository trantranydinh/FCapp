import React, { useState, useRef, useEffect } from 'react';
import {
    Bell,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import moment from 'moment';

const mockSystemNotifications = [
    {
        id: 1,
        title: "System Update v1.2.0",
        message: "New settings and customization features are now available.",
        time: moment().subtract(2, 'hours').toISOString(),
        read: false,
        type: 'system'
    },
    {
        id: 2,
        title: "Maintenance Scheduled",
        message: "System maintenance scheduled for Dec 20, 2025 at 02:00 AM UTC.",
        time: moment().subtract(1, 'day').toISOString(),
        read: true,
        type: 'alert'
    }
];

const mockNewsNotifications = [
    {
        id: 3,
        title: "Cashew Price Alert",
        message: "RCN prices from IVC have increased by 5%.",
        time: moment().subtract(30, 'minutes').toISOString(),
        read: false,
        type: 'news'
    },
    {
        id: 4,
        title: "Market Report Available",
        message: "Weekly market analysis for Vietnam sector is ready.",
        time: moment().subtract(5, 'hours').toISOString(),
        read: true,
        type: 'report'
    }
];

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("system");
    const containerRef = useRef(null);

    const unreadCount = [...mockSystemNotifications, ...mockNewsNotifications].filter(n => !n.read).length;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const NotificationItem = ({ item }) => (
        <div className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${!item.read ? 'bg-primary/5' : ''}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${!item.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium leading-none ${!item.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {item.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                            {moment(item.time).fromNow(true)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.message}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-accent/10"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>

                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab("system")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "system"
                                ? "text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-white"
                                }`}
                        >
                            System
                        </button>
                        <button
                            onClick={() => setActiveTab("news")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "news"
                                ? "text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-white"
                                }`}
                        >
                            News
                        </button>
                    </div>

                    <div className="h-[300px] overflow-y-auto custom-scrollbar">
                        {activeTab === 'system' && (
                            mockSystemNotifications.length > 0 ? (
                                mockSystemNotifications.map(notification => (
                                    <NotificationItem key={notification.id} item={notification} />
                                ))
                            ) : (
                                <EmptyState message="No system notifications" />
                            )
                        )}
                        {activeTab === 'news' && (
                            mockNewsNotifications.length > 0 ? (
                                mockNewsNotifications.map(notification => (
                                    <NotificationItem key={notification.id} item={notification} />
                                ))
                            ) : (
                                <EmptyState message="No news alerts" />
                            )
                        )}
                    </div>

                    <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 hover:bg-white/10">
                            Mark all as read
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
