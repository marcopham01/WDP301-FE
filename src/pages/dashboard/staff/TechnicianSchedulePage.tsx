import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TechnicianSchedulePage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Điều phối KTV</h1>
        <p className="text-muted-foreground">Trang này đang được phát triển.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang phát triển</CardTitle>
          <CardDescription>
            Sẽ hiển thị lịch làm việc, phân công kỹ thuật viên theo lịch hẹn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Gợi ý: bạn có thể xem trước các lịch hẹn tại mục Quản lý lịch hẹn.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
