import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Bell, Globe, Palette, Pin, Save } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState({
        language: 'en',
        timezone: 'utc+7',
        dateFormat: 'dd/mm/yyyy',
        theme: 'dark',
        notifications: true,
        hashtags: '#cashew #market #price',
        pinned: ['Parity Tool', 'Price Forecast']
    });

    useEffect(() => {
        // Load initial settings from localStorage
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    const handleSave = () => {
        setLoading(true);
        // Simulate API call and save to local storage
        setTimeout(() => {
            localStorage.setItem('appSettings', JSON.stringify(settings));
            setLoading(false);
            alert("Settings saved successfully!");
        }, 1000);
    };

    const Input = ({ ...props }) => (
        <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
        />
    );

    const Select = ({ value, onChange, options }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );

    const Label = ({ children }) => (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {children}
        </label>
    );

    const Switch = ({ checked, onCheckedChange }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={`
                peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50
                ${checked ? 'bg-primary' : 'bg-input'}
            `}
        >
            <span
                className={`
                    pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform 
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );

    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 max-w-5xl space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your preferences and application configuration.</p>
                    </div>
                    <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                        {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                </div>

                {/* Custom Tabs */}
                <div className="w-full">
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                        {[
                            { id: 'general', label: 'General' },
                            { id: 'appearance', label: 'Appearance' },
                            { id: 'personalization', label: 'Personalization' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
                                    ${activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : ''}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6">
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        <CardTitle>Regional Preferences</CardTitle>
                                    </div>
                                    <CardDescription>Customize how data is presented to you.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label>Language</Label>
                                        <Select
                                            value={settings.language}
                                            onChange={(val) => setSettings({ ...settings, language: val })}
                                            options={[
                                                { value: "en", label: "English (US)" },
                                                { value: "vi", label: "Tiếng Việt" },
                                                { value: "fr", label: "Français" }
                                            ]}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Timezone</Label>
                                        <Select
                                            value={settings.timezone}
                                            onChange={(val) => setSettings({ ...settings, timezone: val })}
                                            options={[
                                                { value: "utc+7", label: "Indochina Time (UTC+7)" },
                                                { value: "utc", label: "UTC" },
                                                { value: "est", label: "Eastern Time (UTC-5)" }
                                            ]}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Date Format</Label>
                                        <Select
                                            value={settings.dateFormat}
                                            onChange={(val) => setSettings({ ...settings, dateFormat: val })}
                                            options={[
                                                { value: "dd/mm/yyyy", label: "DD/MM/YYYY" },
                                                { value: "mm/dd/yyyy", label: "MM/DD/YYYY" },
                                                { value: "yyyy-mm-dd", label: "YYYY-MM-DD" }
                                            ]}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Appearance Settings */}
                        {activeTab === 'appearance' && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-5 w-5 text-primary" />
                                        <CardTitle>Theme & Style</CardTitle>
                                    </div>
                                    <CardDescription>Adjust the look and feel of the dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Dark Mode</Label>
                                            <p className="text-sm text-muted-foreground">Use the dark theme for low-light environments.</p>
                                        </div>
                                        <Switch
                                            checked={settings.theme === 'dark'}
                                            onCheckedChange={(checked) => setSettings({ ...settings, theme: checked ? 'dark' : 'light' })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Personalization Settings */}
                        {activeTab === 'personalization' && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Pin className="h-5 w-5 text-primary" />
                                        <CardTitle>Content Preferences</CardTitle>
                                    </div>
                                    <CardDescription>Curate what you see on your dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label>Followed Hashtags</Label>
                                        <Input
                                            value={settings.hashtags}
                                            onChange={(e) => setSettings({ ...settings, hashtags: e.target.value })}
                                            placeholder="#cashew #vietnam"
                                        />
                                        <p className="text-xs text-muted-foreground">Separate tags with spaces.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Pinned Tools</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Parity Tool', 'Price Forecast', 'News Watch', 'Reports'].map((tool) => (
                                                <div
                                                    key={tool}
                                                    onClick={() => {
                                                        const newPinned = settings.pinned.includes(tool)
                                                            ? settings.pinned.filter(p => p !== tool)
                                                            : [...settings.pinned, tool];
                                                        setSettings({ ...settings, pinned: newPinned });
                                                    }}
                                                    className={`cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors ${settings.pinned.includes(tool)
                                                            ? 'bg-primary/20 border-primary text-primary font-medium'
                                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                        }`}
                                                >
                                                    {tool}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
