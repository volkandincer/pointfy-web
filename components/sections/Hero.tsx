"use client";

import { memo } from "react";
import { Smartphone, Users, Target, Zap, CheckSquare } from "lucide-react";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";

const heroFeatures = [
  {
    icon: Users,
    title: "Takım Odaları",
    description: "Gerçek zamanlı işbirliği ile takımınızla çalışın",
  },
  {
    icon: Target,
    title: "Poker Planning",
    description: "Görevleri oylayarak daha iyi planlama yapın",
  },
  {
    icon: Zap,
    title: "Hızlı Kararlar",
    description: "Anında güncellemeler ile daha hızlı ilerleyin",
  },
  {
    icon: CheckSquare,
    title: "Görev Yönetimi",
    description: "Tüm projelerinizi tek platformda yönetin",
  },
];

const Hero = memo(function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      {/* Animated Background Elements */}
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl transition-all" />
      <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl transition-all" />
      
      <div className="container relative mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Main Content */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Takımlarınızı Organize Edin,
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Daha Verimli Çalışın
              </span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Poker planning ve retrospektif toplantılarınızı yönetin, görevlerinizi organize edin, 
              Jira ile senkronize çalışın. Takımınızla gerçek zamanlı işbirliği yaparak projelerinizi 
              tek bir platformda yönetin.
            </p>
            <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Button
                variant="primary"
                size="sm"
                disabled
                icon={Smartphone}
                className="shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                App Store&apos;dan İndir - Yakında
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled
                icon={Smartphone}
                className="shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Google Play&apos;den İndir - Yakında
              </Button>
            </div>
          </div>

          {/* Feature Highlights Slider */}
          <div className="mx-auto max-w-3xl">
            <Slider
              autoPlay={true}
              interval={5000}
              showDots={true}
              showArrows={true}
              transition="fade"
            >
              {heroFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-lg transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 blur-2xl transition-all group-hover:scale-150" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="mb-1 text-lg font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;
