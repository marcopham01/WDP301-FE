// utils/seedIssueTypes.ts
// Script để thêm data mẫu cho Issue Types
// Chỉ chạy một lần để seed data

import { createIssueTypeApi, IssueCategory, IssueSeverity } from "@/lib/issueTypeApi";

interface SeedIssueType {
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
}

// Data mẫu phổ biến cho các loại vấn đề xe điện
const sampleIssueTypes: SeedIssueType[] = [
  // Battery issues
  {
    category: "battery",
    severity: "critical",
    description: "Pin hết hạn sử dụng hoặc hư hỏng nghiêm trọng",
  },
  {
    category: "battery",
    severity: "major",
    description: "Dung lượng pin giảm đáng kể",
  },
  {
    category: "battery",
    severity: "moderate",
    description: "Pin sạc chậm hơn bình thường",
  },
  {
    category: "battery",
    severity: "minor",
    description: "Cảnh báo pin yếu thường xuyên",
  },

  // Motor issues
  {
    category: "motor",
    severity: "critical",
    description: "Động cơ không hoạt động",
  },
  {
    category: "motor",
    severity: "major",
    description: "Động cơ phát ra tiếng ồn bất thường",
  },
  {
    category: "motor",
    severity: "moderate",
    description: "Công suất động cơ giảm",
  },

  // Charging issues
  {
    category: "charging",
    severity: "critical",
    description: "Không thể sạc pin",
  },
  {
    category: "charging",
    severity: "major",
    description: "Cổng sạc bị hỏng",
  },
  {
    category: "charging",
    severity: "moderate",
    description: "Sạc chậm hoặc ngắt quãng",
  },
  {
    category: "charging",
    severity: "minor",
    description: "Đèn báo sạc không hoạt động",
  },

  // Brake issues
  {
    category: "brake",
    severity: "critical",
    description: "Phanh không hoạt động",
  },
  {
    category: "brake",
    severity: "major",
    description: "Phanh kém hiệu quả",
  },
  {
    category: "brake",
    severity: "moderate",
    description: "Phanh kêu lạo xạo",
  },

  // Cooling issues
  {
    category: "cooling",
    severity: "major",
    description: "Hệ thống làm mát quá nhiệt",
  },
  {
    category: "cooling",
    severity: "moderate",
    description: "Quạt làm mát không hoạt động",
  },

  // Electrical issues
  {
    category: "electrical",
    severity: "major",
    description: "Đèn pha không sáng",
  },
  {
    category: "electrical",
    severity: "moderate",
    description: "Hệ thống điện bị chập chờn",
  },
  {
    category: "electrical",
    severity: "minor",
    description: "Đèn tín hiệu không hoạt động",
  },

  // Software issues
  {
    category: "software",
    severity: "major",
    description: "Màn hình điều khiển bị treo",
  },
  {
    category: "software",
    severity: "moderate",
    description: "Phần mềm cần cập nhật",
  },
  {
    category: "software",
    severity: "minor",
    description: "Lỗi hiển thị thông tin",
  },

  // Mechanical issues
  {
    category: "mechanical",
    severity: "major",
    description: "Trục truyền bị hỏng",
  },
  {
    category: "mechanical",
    severity: "moderate",
    description: "Tiếng kêu bất thường từ gầm xe",
  },

  // Suspension issues
  {
    category: "suspension",
    severity: "major",
    description: "Giảm xóc bị rò rỉ",
  },
  {
    category: "suspension",
    severity: "moderate",
    description: "Hệ thống treo mất cân bằng",
  },

  // Tire issues
  {
    category: "tire",
    severity: "major",
    description: "Lốp bị xì hơi nghiêm trọng",
  },
  {
    category: "tire",
    severity: "moderate",
    description: "Lốp mòn không đều",
  },
  {
    category: "tire",
    severity: "minor",
    description: "Áp suất lốp thấp",
  },

  // Other issues
  {
    category: "other",
    severity: "moderate",
    description: "Cửa xe không đóng kín",
  },
  {
    category: "other",
    severity: "minor",
    description: "Gương chiếu hậu bị lỏng",
  },
];

export async function seedIssueTypes() {
  console.log("🌱 Bắt đầu seed Issue Types data...");
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const issueType of sampleIssueTypes) {
    try {
      const result = await createIssueTypeApi({
        category: issueType.category,
        severity: issueType.severity,
      });

      if (result.ok) {
        successCount++;
        console.log(`✅ Đã tạo: ${issueType.category} - ${issueType.severity}`);
      } else {
        errorCount++;
        const errorMsg = `${issueType.category} - ${issueType.severity}: ${result.message}`;
        errors.push(errorMsg);
        console.log(`⚠️ Lỗi: ${errorMsg}`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `${issueType.category} - ${issueType.severity}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.log(`❌ Exception: ${errorMsg}`);
    }

    // Delay nhỏ giữa các requests để tránh overwhelm server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n📊 Kết quả seed data:");
  console.log(`✅ Thành công: ${successCount}/${sampleIssueTypes.length}`);
  console.log(`❌ Lỗi: ${errorCount}/${sampleIssueTypes.length}`);
  
  if (errors.length > 0) {
    console.log("\n⚠️ Chi tiết lỗi:");
    errors.forEach(err => console.log(`  - ${err}`));
  }

  return {
    success: successCount,
    error: errorCount,
    total: sampleIssueTypes.length,
    errors,
  };
}

// Export data để có thể xem
export { sampleIssueTypes };
