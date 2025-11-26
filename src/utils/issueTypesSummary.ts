/**
 * QUICK REFERENCE - Kho phụ tùng Data Mẫu
 * 
 * Tổng số: 30+ Kho phụ tùng
 * 
 * Cách thêm nhanh:
 * 1. Vào /dashboard/admin/issue-types
 * 2. Click nút "🌱 Thêm data mẫu"
 * 3. Đợi 3-5 giây
 * 4. Xong!
 * 
 * Categories:
 * ✅ battery (4)     - Pin
 * ✅ motor (3)       - Động cơ
 * ✅ charging (4)    - Sạc điện
 * ✅ brake (3)       - Phanh
 * ✅ cooling (2)     - Làm mát
 * ✅ electrical (3)  - Điện
 * ✅ software (3)    - Phần mềm
 * ✅ mechanical (2)  - Cơ khí
 * ✅ suspension (2)  - Hệ thống treo
 * ✅ tire (3)        - Lốp xe
 * ✅ other (2)       - Khác
 * 
 * Severity Levels:
 * 🔴 critical   - Nghiêm trọng (khẩn cấp)
 * 🟠 major      - Lớn (ưu tiên cao)
 * 🟡 moderate   - Trung bình (cần xử lý)
 * 🔵 minor      - Nhỏ (không khẩn cấp)
 */

export const ISSUE_TYPES_SUMMARY = {
  totalCount: 30,
  categories: {
    battery: { count: 4, label: "Pin" },
    motor: { count: 3, label: "Động cơ" },
    charging: { count: 4, label: "Sạc điện" },
    brake: { count: 3, label: "Phanh" },
    cooling: { count: 2, label: "Làm mát" },
    electrical: { count: 3, label: "Điện" },
    software: { count: 3, label: "Phần mềm" },
    mechanical: { count: 2, label: "Cơ khí" },
    suspension: { count: 2, label: "Hệ thống treo" },
    tire: { count: 3, label: "Lốp xe" },
    other: { count: 2, label: "Khác" },
  },
  severityDistribution: {
    critical: 5,
    major: 11,
    moderate: 11,
    minor: 4,
  },
} as const;
