import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, Home, MapPinned } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <section className="relative flex min-h-[calc(100vh-220px)] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_30%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--secondary)/0.35),hsl(var(--background)))]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-primary/20 bg-primary/10 text-primary shadow-primary">
          <span className="text-3xl font-black">404</span>
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Ошибка маршрута
        </p>

        <h1 className="mb-4 text-3xl font-black text-foreground md:text-5xl">
          Страница не найдена
        </h1>

        <p className="mx-auto mb-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Возможно, ссылка устарела, адрес был введен с ошибкой или нужный раздел был перемещен.
          Воспользуйтесь навигацией сайта или быстрыми переходами ниже.
        </p>

        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-border/70 bg-card/90 px-5 py-4 shadow-elevation-1">
          <p className="mb-1 text-sm font-medium text-foreground">Недоступный адрес</p>
          <p className="break-all font-mono text-sm text-muted-foreground">{location.pathname}</p>
        </div>

        <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-[220px]">
            <Link to="/">
              <Home className="h-4 w-4" />
              На главную страницу
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="min-w-[220px]">
            <Link to="/catalog">
              <Compass className="h-4 w-4" />
              Перейти в каталог
            </Link>
          </Button>

          <Button type="button" variant="ghost" size="lg" className="min-w-[180px]" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        </div>

        <div className="grid gap-4 text-left md:grid-cols-2">
          <Link
            to="/contacts"
            className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevation-2"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPinned className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-foreground">Открыть контакты</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Перейти на страницу со способами связи, адресом компании и интерактивной картой.
            </p>
          </Link>

          <div className="rounded-2xl border border-dashed border-border bg-card/70 p-5 shadow-elevation-1">
            <h2 className="mb-2 text-base font-semibold text-foreground">Что можно сделать дальше</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Проверьте правильность адреса в строке браузера или воспользуйтесь верхним меню для перехода
              к нужному разделу веб-сайта.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
