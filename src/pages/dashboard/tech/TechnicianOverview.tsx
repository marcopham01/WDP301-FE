import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wrench, Clock, CheckCircle, Battery, FileText } from "lucide-react";

export const TechnicianOverview = () => {
  // Mock data
  const assignedTasks = [
    {
      id: 1,
      vehicle: "Tesla Model 3 - 5YJ3E1EA4LF123456",
      customer: "Nguyễn Văn An",
      service: "Bảo dưỡng định kỳ",
      priority: "high",
      assignedDate: "2024-01-20",
      estimatedHours: 3,
      description:
        "Kiểm tra tổng thể hệ thống điện, thay dầu phanh, kiểm tra phanh",
    },
    {
      id: 2,
      vehicle: "VinFast VF8 - VF1VF8EA4LF234567",
      customer: "Trần Thị Bình",
      service: "Thay pin",
      priority: "medium",
      assignedDate: "2024-01-20",
      estimatedHours: 5,
      description: "Thay thế module pin bị hỏng, kiểm tra hệ thống sạc",
    },
  ];

  const inProgressTasks = [
    {
      id: 3,
      vehicle: "BMW iX - WBAXG91060AL12345",
      customer: "Lê Văn Cường",
      service: "Sửa chữa hệ thống sạc",
      progress: 65,
      startTime: "09:00",
      estimatedCompletion: "15:00",
      description: "Thay thế bộ sạc chính, cập nhật phần mềm",
    },
  ];

  const completedTasks = [
    {
      id: 4,
      vehicle: "Audi e-tron - WA1VAAGE1LB123456",
      customer: "Phạm Thị Dung",
      service: "Kiểm tra định kỳ",
      completedDate: "2024-01-19",
      completedTime: "16:30",
      rating: 5,
      feedback: "Công việc thực hiện tốt, xe hoạt động ổn định",
    },
    {
      id: 5,
      vehicle: "Hyundai Kona Electric",
      customer: "Hoàng Văn Em",
      service: "Thay lốp và kiểm tra hệ thống",
      completedDate: "2024-01-18",
      completedTime: "11:45",
      rating: 4,
      feedback: "Làm việc chuyên nghiệp, nhanh chóng",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      case "low":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  return (
    <main className="flex-1 p-6 bg-background">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Dashboard Kỹ thuật viên</h2>
        <p className="text-muted-foreground">
          Quản lý công việc được giao và tiến độ thực hiện
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Công việc được giao
                </p>
                <p className="text-2xl font-bold">{assignedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang thực hiện</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Hoàn thành tuần này
                </p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-electric/10">
                <Battery className="h-5 w-5 text-electric" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Đánh giá trung bình
                </p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Công việc được giao
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Đang thực hiện
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đã hoàn thành
          </TabsTrigger>
        </TabsList>

        {/* Assigned Tasks */}
        <TabsContent value="assigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Công việc được giao ({assignedTasks.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {assignedTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{task.vehicle}</h4>
                        <Badge
                          className={`${getPriorityColor(
                            task.priority
                          )} text-white`}>
                          Ưu tiên {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {task.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ngày giao</p>
                          <p className="font-medium">{task.assignedDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Thời gian dự kiến
                          </p>
                          <p className="font-medium">
                            {task.estimatedHours} giờ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-primary text-primary-foreground">
                      Bắt đầu công việc
                    </Button>
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* In Progress Tasks */}
        <TabsContent value="progress" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Đang thực hiện ({inProgressTasks.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {inProgressTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{task.vehicle}</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {task.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Bắt đầu</p>
                          <p className="font-medium">{task.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Dự kiến hoàn thành
                          </p>
                          <p className="font-medium">
                            {task.estimatedCompletion}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tiến độ</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Cập nhật tiến độ
                    </Button>
                    <Button variant="outline" size="sm">
                      Gửi báo cáo
                    </Button>
                    <Button
                      className="bg-success text-success-foreground"
                      size="sm">
                      Hoàn thành
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Tasks */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Đã hoàn thành gần đây</h3>
          </div>

          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{task.vehicle}</h4>
                        <Badge className="bg-success text-white">
                          Hoàn thành
                        </Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(task.rating)].map((_, i) => (
                            <CheckCircle
                              key={i}
                              className="h-4 w-4 text-warning fill-current"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Hoàn thành</p>
                          <p className="font-medium">
                            {task.completedDate} - {task.completedTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Đánh giá</p>
                          <p className="font-medium">{task.rating}/5 sao</p>
                        </div>
                      </div>

                      {task.feedback && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Phản hồi từ khách hàng:
                          </p>
                          <p className="text-sm italic">"{task.feedback}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};
