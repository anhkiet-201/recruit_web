import { JobStatus } from "@/models/JobStatus";

export const getJobStatusColor = (status: string | JobStatus): "green" | "gray" | "red" | "yellow" | "blue" | "purple" => {
    switch (status) {
        case JobStatus.ACTIVE: return "green";
        case JobStatus.DRAFT: return "gray";
        case JobStatus.EXPIRED: return "red";
        case JobStatus.REVIEWING: return "yellow";
        case JobStatus.ACCEPTED: return "green";
        case JobStatus.REJECTED: return "red";
        default: return "gray";
    }
};
