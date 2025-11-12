import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QueuePage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hàng chờ</h1>
        <p className="text-muted-foreground">Trang này đang được phát triển.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang phát triển</CardTitle>
          <CardDescription>
            Sẽ hiển thị danh sách công việc/lịch hẹn đang chờ xử lý để phân bổ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Gợi ý: chuyển tới Tổng quan để xem số liệu nhanh.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
