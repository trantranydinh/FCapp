import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { UploadCloud, File, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/apiClient";
import { cn } from "../lib/utils";

export default function FileUploadCard({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (file) => {
        const validTypes = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError("File size should be less than 5MB.");
            return;
        }

        setFile(file);
        setError(null);
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/api/v1/forecast/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }

            removeFile();

        } catch (err) {
            console.error("Upload failed:", err);
            setError(err.message || "Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="glass-card border-none overflow-hidden">
            <CardHeader>
                <CardTitle>Upload Data</CardTitle>
                <CardDescription>Upload historical data to generate new forecasts</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-all duration-200",
                        isDragging
                            ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                            : "border-muted-foreground/25 hover:border-red-500/50 hover:bg-red-50/30 dark:hover:bg-red-900/5",
                        error ? "border-red-500/50 bg-red-50/10" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {file ? (
                        <div className="flex flex-col items-center gap-3 p-4 text-center animate-in fade-in zoom-in duration-200">
                            <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20">
                                <File className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground max-w-[200px] truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <div className="p-3 rounded-full bg-muted text-muted-foreground group-hover:scale-110 transition-transform duration-200 group-hover:text-red-500 group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                                <UploadCloud className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    Drag & drop or click to upload
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    CSV or Excel files (max 5MB)
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select File
                            </Button>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                    />
                </div>

                {error && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md animate-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={cn(
                            "w-full sm:w-auto transition-all duration-200 bg-red-600 hover:bg-red-700 text-white",
                            isUploading ? "opacity-80 cursor-not-allowed" : ""
                        )}
                    >
                        {isUploading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="h-4 w-4 mr-2" />
                                Upload & Forecast
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
