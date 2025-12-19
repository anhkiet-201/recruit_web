"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from "lucide-react";
import { JobService } from "@/services/jobService";

interface ImportJobDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportJobDialog({ isOpen, onClose, onSuccess }: ImportJobDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ count: number; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDownloadTemplate = () => {
        // Create a simple CSV content for template
        const headers = ["Title", "Description", "Location", "MinSalary", "MaxSalary", "Experience", "Deadline", "JobType", "Tags"];
        const example = ["Senior React Dev", "We need a dev...", "Remote", "2000", "4000", "3", "2025-12-31", "skilled", "React, TypeScript"];
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + example.join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "job_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const res = await JobService.importJobs(file);
            setResult(res);
            if (res.count > 0) {
                onSuccess();
            }
        } catch (error) {
            console.error("Import failed", error);
            alert("Import failed. Please check the file format.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 border border-gray-100">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Import Jobs from Excel</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6"> 
                    
                    {!result ? (
                        <>
                            {/* Upload Area */}
                            <div 
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${ 
                                    isDragging 
                                        ? "border-blue-500 bg-blue-50" 
                                        : "border-gray-300 hover:bg-gray-50"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls, .csv" 
                                    onChange={handleFileSelect}
                                />
                                
                                {file ? (
                                    <div className="flex flex-col items-center text-center">
                                        <FileSpreadsheet size={48} className="text-green-600 mb-2" />
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="mt-3 text-xs text-red-600 hover:underline"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="bg-blue-100 p-3 rounded-full mb-3">
                                            <Upload size={24} className="text-blue-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Excel (.xlsx) or CSV files
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Template Download */}
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet size={18} className="text-gray-500" />
                                    <span className="text-sm text-gray-600">Need a template?</span>
                                </div>
                                <button 
                                    onClick={handleDownloadTemplate}
                                    className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-semibold text-green-800">Import Completed</h4>
                                    <p className="text-sm text-green-700">Successfully created {result.count} jobs.</p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3 mb-2">
                                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                                        <h4 className="text-sm font-semibold text-red-800">Errors ({result.errors.length})</h4>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto text-xs text-red-700 space-y-1 pl-8">
                                        {result.errors.map((err, idx) => (
                                            <p key={idx}>Row {err.row}: {err.error}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                                <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                                    >
                                        {result ? "Close" : "Cancel"}
                                    </button>
                                    {!result && (
                                        <button
                                            type="button"
                                            onClick={handleImport}
                                            disabled={!file || uploading}
                                            className={`px-6 py-2.5 text-sm font-bold text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                                                !file || uploading
                                                    ? "bg-gray-400 cursor-not-allowed shadow-none"
                                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                                            }`}
                                        >                            {uploading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {uploading ? "Importing..." : "Import Jobs"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
