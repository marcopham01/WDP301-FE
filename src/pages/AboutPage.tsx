import { motion } from "framer-motion";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Target, Star, Users, Sparkles, Award, Heart, CheckCircle } from "lucide-react";

const AboutPage = () => {
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setTimeout(() => (window.location.href = "/login"), 400);
  };

  // Entrance animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  } as const;
  const fade = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } } as const;
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12, when: "beforeChildren" } } } as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col bg-gradient-to-b from-ev-green-light/25 via-white to-white"
    >
      <Header onLogout={handleLogout} />

  <main className="flex-1 pb-0">
        {/* Hero */}
        <motion.section
          className="pt-28 pb-14 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="container max-w-7xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-ev-green">
              Về EV Care
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Nền tảng dịch vụ bảo dưỡng và sửa chữa xe điện toàn diện giúp bạn yên tâm
              vận hành, tối ưu hiệu suất và đồng hành trong hành trình xanh bền vững.
            </p>
          </div>
        </motion.section>

        {/* Mission & Vision */}
        <motion.section
          className="container max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={fadeUp}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-ev-green/15 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-ev-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Sứ mệnh của chúng tôi</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Nâng tầm dịch vụ bảo dưỡng xe điện, tối ưu chi phí, tiết kiệm thời gian cho khách hàng,
                    và xây dựng hệ sinh thái minh bạch, an tâm.
                  </p>
                </div>
              </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-teal-500/15 flex items-center justify-center">
                  <Target className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Tầm nhìn của chúng tôi</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Trở thành nền tảng dịch vụ xe điện dẫn đầu khu vực với hiệu quả vận hành cao,
                    trải nghiệm liền mạch và cam kết phát triển xanh.
                  </p>
                </div>
              </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Why choose */}
        <motion.section
          className="container max-w-7xl pt-20"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className="text-center mb-6" variants={fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Vì sao chọn EV Care?</h2>
            <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-4xl mx-auto leading-relaxed">
              Chúng tôi kết hợp công nghệ tiên tiến với đội ngũ xuất sắc để mang tới trải nghiệm
              bảo dưỡng xe điện tốt nhất.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-7 text-center space-y-3">
                <Users className="mx-auto w-9 h-9 text-ev-green" />
                <h3 className="font-semibold text-base">Dịch vụ đáng tin cậy</h3>
                <p className="text-sm text-muted-foreground">Quy trình rõ ràng, bảo hành minh bạch.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-7 text-center space-y-3">
                <Award className="mx-auto w-9 h-9 text-ev-green" />
                <h3 className="font-semibold text-base">Đảm bảo chất lượng</h3>
                <p className="text-sm text-muted-foreground">Linh kiện chính hãng, đội ngũ chuyên môn.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-7 text-center space-y-3">
                <Star className="mx-auto w-9 h-9 text-ev-green" />
                <h3 className="font-semibold text-base">Lấy khách hàng làm trọng tâm</h3>
                <p className="text-sm text-muted-foreground">Minh bạch chi phí, chăm sóc tận tình.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-7 text-center space-y-3">
                <Sparkles className="mx-auto w-9 h-9 text-ev-green" />
                <h3 className="font-semibold text-base">Đổi mới</h3>
                <p className="text-sm text-muted-foreground">Ứng dụng công nghệ để tối ưu trải nghiệm.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats band */}
        <motion.section className="mt-20 bg-gradient-to-r from-ev-green to-teal-600 text-white" variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <div className="container max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight">500+</div>
              <div className="text-sm md:text-base opacity-90">Khách hàng hài lòng</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight">50+</div>
              <div className="text-sm md:text-base opacity-90">Trung tâm dịch vụ</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight">99%</div>
              <div className="text-sm md:text-base opacity-90">Mức độ hài lòng</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight">24/7</div>
              <div className="text-sm md:text-base opacity-90">Hỗ trợ khách hàng</div>
            </div>
          </div>
        </motion.section>

        {/* Core values */}
        <motion.section className="container max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-10 pt-20 items-stretch" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.div className="md:col-span-2" variants={fadeUp}>
            <h3 className="text-3xl font-bold mb-6 tracking-tight">Giá trị cốt lõi</h3>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Những nguyên tắc nền tảng định hình mọi hoạt động của chúng tôi, cam kết chất lượng
              và sự bền vững.
            </p>
            <ul className="space-y-4 text-lg">
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Trách nhiệm với môi trường</motion.li>
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Sự hài lòng của khách hàng</motion.li>
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Xuất sắc về kỹ thuật</motion.li>
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Minh bạch & Tin cậy</motion.li>
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Cải tiến liên tục</motion.li>
              <motion.li variants={fadeUp} className="flex items-start gap-3"><CheckCircle className="mt-1 h-5 w-5 text-ev-green"/> Hỗ trợ cộng đồng</motion.li>
            </ul>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="h-full bg-gradient-to-br from-white to-teal-50 border border-teal-100 shadow-sm">
              <CardContent className="h-full p-10 md:p-12 text-center flex flex-col items-center justify-center gap-5 min-h-[320px]">
                <div className="w-24 h-24 rounded-full bg-rose-50 ring-1 ring-rose-100 shadow-sm flex items-center justify-center">
                  <Heart className="w-12 h-12 text-rose-500" />
                </div>
                <h4 className="text-2xl md:text-3xl font-semibold tracking-tight">Cam kết xuất sắc</h4>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                  Mọi tương tác, mọi dịch vụ, mọi khoảnh khắc đều được dẫn dắt bởi cam kết bền bỉ về chất lượng.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* CTA full-width band */}
        <motion.section className="mt-10 bg-gradient-to-r from-ev-green to-teal-600 text-white" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <div className="container max-w-6xl py-10 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold mb-3">Sẵn sàng trải nghiệm EV Care?</h3>
            <p className="text-base md:text-lg opacity-90 mb-6">Hãy cùng hàng nghìn khách hàng tin tưởng EV Care cho nhu cầu bảo dưỡng xe điện của bạn.</p>
            <Button
              variant="secondary"
              className="px-6 py-5 bg-white text-teal-700 hover:bg-white/90"
            >
              Đặt lịch ngay
            </Button>
          </div>
        </motion.section>
      </main>

      <Footer />
    </motion.div>
  );
};

export default AboutPage;
