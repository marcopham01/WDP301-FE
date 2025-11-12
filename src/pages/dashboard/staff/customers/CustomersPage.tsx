import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomersPage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý khách hàng</h1>
        <p className="text-muted-foreground">Trang này đang được phát triển.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang phát triển</CardTitle>
          <CardDescription>
            Chúng tôi sẽ sớm bổ sung danh sách khách hàng, tìm kiếm và các thao tác quản lý.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Gợi ý: chuyển tới mục Lịch hẹn hoặc Tổng quan để xem dữ liệu hiện có.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
