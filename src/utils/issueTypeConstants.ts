// utils/issueTypeConstants.ts
import { IssueCategory, IssueSeverity } from "@/lib/issueTypeApi";

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  battery: "Pin",
  motor: "Động cơ",
  charging: "Sạc điện",
  brake: "Phanh",
  cooling: "Làm mát",
  electrical: "Điện",
  software: "Phần mềm",
  mechanical: "Cơ khí",
  suspension: "Hệ thống treo",
  tire: "Lốp xe",
  other: "Khác",
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  minor: "Nhỏ",
  moderate: "Trung bình",
  major: "Lớn",
  critical: "Nghiêm trọng",
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  minor: "bg-blue-100 text-blue-800",
  moderate: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};
