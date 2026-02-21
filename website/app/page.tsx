"use client";
import { useState, useEffect } from "react";
import {
  Route,
  Globe2,
  Car,
  ClipboardX,
  Trophy,
  TrendingDown,
  Leaf,
  ShoppingBag,
  MapPin,
  ArrowRightLeft,
  BadgeCheck,
  Smartphone,
  Monitor,
  Check,
} from "lucide-react";

export default function Home() {
  const [showNavCta, setShowNavCta] = useState(false);

  useEffect(() => {
    const check = () => {
      const heroBtn = document.getElementById("hero-cta");
      if (!heroBtn) return;
      setShowNavCta(heroBtn.getBoundingClientRect().bottom < 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🦕</span>
            <span className="text-xl font-bold text-green-700">The Green Way</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#problem" className="hover:text-green-700 transition-colors">Problem</a>
            <a href="#solution" className="hover:text-green-700 transition-colors">Solution</a>
            <a href="#features" className="hover:text-green-700 transition-colors">Features</a>
            <a href="#businesses" className="hover:text-green-700 transition-colors">Partners</a>
            <a href="#story" className="hover:text-green-700 transition-colors">Our Story</a>
          </div>
          <a
            href="#contact"
            className={`rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-green-700 ${showNavCta ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          >
            Get Early Access
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-white px-6 py-28 text-center">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
            Launching across the South West 2026
          </span>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
            Skip the highway,<br />
            <span className="text-green-600">take The Green Way.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-xl leading-relaxed text-gray-600">
            Green commuting routes for employees. Automatic emissions data for managers.
            Rewards to spend at local businesses along the way.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              id="hero-cta"
              href="#contact"
              className="w-full rounded-full bg-green-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 hover:shadow-xl sm:w-auto"
            >
              Get Early Access
            </a>
            <a
              href="#solution"
              className="w-full rounded-full border-2 border-green-200 bg-white px-8 py-4 text-base font-bold text-green-700 transition-all hover:border-green-400 sm:w-auto"
            >
              See How It Works
            </a>
          </div>
        </div>

      </section>

      {/* ── Problem ── */}
      <section id="problem" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 text-center text-4xl font-extrabold tracking-tight text-gray-900">
            Most companies want to cut commuting emissions. Few have a way to.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                Icon: Globe2,
                title: "The pressure is real",
                body: "The UN warned that climate effects could be irreversible by 2030. 57% of UK consumers think companies are hiding their true environmental impact. It's getting harder to ignore.",
              },
              {
                Icon: Car,
                title: "Commuting is a big part of the problem",
                body: "Employee commuting counts as Scope 3 emissions under the GHG Protocol. 45% of UK workers drive, and with more people back in the office, those numbers are going up.",
              },
              {
                Icon: ClipboardX,
                title: "The tools that exist aren't working",
                body: "Most apps tackle one mode of transport, or make employees log journeys by hand. Most of it is too clunky to bother with. So people don't.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <Icon className="mb-4 h-8 w-8 text-green-600" strokeWidth={1.5} />
                <h3 className="mb-3 text-lg font-bold text-gray-900">{title}</h3>
                <p className="leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section id="solution" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-900">
            An app for employees. A dashboard for managers.
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-gray-600">
            Employees get sustainable route suggestions and earn rewards for using them.
            Managers get the emissions data they've been trying to collect for years, automatically.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Employee app */}
            <div className="rounded-3xl bg-green-600 p-8 text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/50 px-4 py-1 text-sm font-semibold">
                <Smartphone className="h-4 w-4" strokeWidth={1.5} /> Employee App
              </div>
              <h3 className="mb-4 text-2xl font-bold">Get to work greener, and get rewarded for it.</h3>
              <ul className="space-y-3 text-green-100">
                {[
                  "Route suggestions for bus, train, bike, or walking, based on where you're starting from",
                  "Carbon savings tracked automatically, to ISO 14083:2023",
                  "Earn points for every green journey",
                  "Spend points at nearby cafes, shops, and local businesses",
                  "Company leaderboards and monthly challenges",
                  "Bike-friendly routing with crowdsourced parking spots",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-300" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard */}
            <div className="rounded-3xl border-2 border-green-100 bg-white p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1 text-sm font-semibold text-green-700">
                <Monitor className="h-4 w-4" strokeWidth={1.5} /> Manager Dashboard
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Your team's emissions data, collected automatically.</h3>
              <ul className="space-y-3 text-gray-600">
                {[
                  "Real-time Scope 3 emissions data, no manual entry",
                  "Insights by department, location, or individual",
                  "ESG reports you can export and send directly",
                  "Run green challenges across teams or the whole company",
                  "Set net-zero targets and track progress against them",
                  "See how your numbers compare to others in your sector",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-gray-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 text-center text-4xl font-extrabold tracking-tight text-white">
            How it works
          </h2>
          <div className="grid gap-10 sm:grid-cols-2">
            {[
              {
                Icon: Route,
                title: "Sustainable routes",
                body: "Tell us where you're going. We'll find the lowest-carbon route (bus, train, bike, or on foot) and track exactly how much CO₂ you saved, calculated to ISO 14083:2023.",
              },
              {
                Icon: Trophy,
                title: "Points and leaderboards",
                body: "Every green journey earns points. Employees can see how they rank against colleagues and compete in company-wide challenges set by managers.",
              },
              {
                Icon: TrendingDown,
                title: "Automatic emissions tracking",
                body: "No spreadsheets, no manual logging. Managers get a live breakdown of their team's Scope 3 travel emissions, ready for your ESG reports.",
              },
              {
                Icon: Leaf,
                title: "Spend at local sustainable businesses",
                body: "Points can be redeemed at nearby sustainable businesses. Employees get a discount. The business gets a new customer.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600/20">
                  <Icon className="h-5 w-5 text-green-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Companies ── */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900">
                What your company actually gets
              </h2>
              <div className="space-y-5">
                {[
                  {
                    n: "1",
                    title: "Actual emissions reductions",
                    desc: "Not offsets. Fewer cars on the road. Employees switch to greener routes because there's a real reason to.",
                  },
                  {
                    n: "2",
                    title: "Data you can put in a report",
                    desc: "Scope 3 travel emissions, per person, per journey, updated automatically. No more estimating from staff surveys.",
                  },
                  {
                    n: "3",
                    title: "Something employees actually use",
                    desc: "The rewards make it worthwhile. Discounts at local cafes and shops are a lot more compelling than a sustainability newsletter.",
                  },
                  {
                    n: "4",
                    title: "Fewer cars in the car park",
                    desc: "A useful side effect for offices where every parking space is already spoken for.",
                  },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                      {n}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{title}</div>
                      <div className="mt-0.5 text-sm text-gray-600">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-green-100">
              <div className="mb-6 text-lg font-bold text-gray-900">Pricing</div>
              <div className="mb-2 text-4xl font-extrabold text-green-600">
                Per-seat subscriptions
              </div>
              <p className="mb-8 text-gray-600">
                Corporate licences with access to the full employee app and manager dashboard.
                Pricing scales with your team.
              </p>
              <a
                href="#"
                className="block rounded-full bg-green-600 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"
              >
                Request a Demo
              </a>
              <p className="mt-4 text-center text-xs text-gray-400">
                Launching across the South West
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── For Local Businesses ── */}
      <section id="businesses" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-900">
            For local sustainable businesses
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-gray-600">
            Local sustainable businesses are easy to walk past. Not because they're worse,
            just because nobody told you they were there. The Green Way puts you in front of
            people already heading past, and gives them a reason to stop.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                Icon: ShoppingBag,
                title: "Customers through your door",
                body: "Employees redeem points at your till. You get customers who already want to spend locally.",
              },
              {
                Icon: MapPin,
                title: "On the in-app map",
                body: "Visible to every user nearby. No ad budget required.",
              },
              {
                Icon: ArrowRightLeft,
                title: "A stop along the route",
                body: "We suggest your business as a waypoint along nearby sustainable routes, right when someone's already heading past.",
              },
              {
                Icon: BadgeCheck,
                title: "Handpicked by us",
                body: "We choose which businesses to list ourselves, based on how they actually operate. Got B Corp or Fairtrade certification? We'll show it on your profile.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-green-100 bg-green-50 p-6">
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-green-600" strokeWidth={1.5} />
                <div>
                  <h3 className="mb-1 font-bold text-gray-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="#"
              className="inline-block rounded-full border-2 border-green-600 px-8 py-3 font-semibold text-green-700 transition-all hover:bg-green-600 hover:text-white"
            >
              List Your Business
            </a>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section id="story" className="px-6 py-24 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-900">
            Who we are
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-gray-600">
            Six computer science students at the University of Bath. The Green Way started
            as a coursework project for an entrepreneurship module. We enjoyed it enough
            that we'd rather it become a real company than just a good grade.
          </p>

          {/* Team grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Carissa Choi",
                role: "Chief Administrative Officer",
                initial: "C",
                colour: "bg-emerald-100 text-emerald-700",
                bio: "The reason there are actual contracts, actual deadlines, and a general sense that everyone knows what they're doing. Handles the parts of running a company that nobody else wants to think about.",
              },
              {
                name: "Charlotte Chrysostom",
                role: "Chief Creative Officer",
                initial: "C",
                colour: "bg-lime-100 text-lime-700",
                bio: "Behind everything you can see: the brand, the app, and the choice of dinosaur. Also runs our sprints, which she takes more seriously than the rest of us. Probably for the best.",
              },
              {
                name: "Elizabeth Rigby",
                role: "Chief Strategy Officer",
                initial: "E",
                colour: "bg-teal-100 text-teal-700",
                bio: "Figures out where we should be going and argues for it until the rest of us agree. Crochets dinosaurs in her spare time and will dress as one given the slightest opportunity.",
              },
              {
                name: "Isabella Mullings Wong",
                role: "Chief of Staff",
                initial: "I",
                colour: "bg-green-100 text-green-700",
                bio: "Keeps the team pointed in the same direction, which is harder than it sounds when everyone has opinions. Joined us from Rolls Royce and Deloitte, which she describes as invaluable for knowing exactly what to avoid.",
              },
              {
                name: "Megan Edwards",
                role: "Chief Customer Officer",
                initial: "M",
                colour: "bg-cyan-100 text-cyan-700",
                bio: "Spends most of her time talking to actual customers, then comes back and tells us which of our ideas were bad. Has been right more often than is comfortable.",
              },
              {
                name: "Tom Muirhead",
                role: "Chief Product Officer",
                initial: "T",
                colour: "bg-emerald-100 text-emerald-800",
                bio: "Turns ideas into things you can actually click on. Insisted on three rounds of user testing before we shipped anything, and was correct to. Does not use the app himself. He commutes by motorbike.",
              },
            ].map(({ name, role, initial, colour, bio }) => (
              <div
                key={name}
                className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold ${colour}`}>
                  {initial}
                </div>
                <div className="mb-0.5 font-bold text-gray-900">{name}</div>
                <div className="mb-3 text-sm font-medium text-green-600">{role}</div>
                <p className="text-sm leading-relaxed text-gray-600">{bio}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section
        id="contact"
        className="bg-green-700 px-6 py-24 text-white text-center"
      >
        <div className="mx-auto max-w-2xl">
          <span className="mx-auto mb-4 block text-6xl">🦕</span>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight">
            Get in early.
          </h2>
          <p className="mb-10 text-lg text-green-100">
            We're launching across the South West. If you're a company trying to cut emissions,
            an employee who'd rather not drive, or a local business that wants more customers
            through the door, we want to hear from you.
          </p>
          <a
            href="#"
            className="inline-block rounded-full bg-white px-10 py-4 font-bold text-green-700 transition-colors hover:bg-green-50"
          >
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦕</span>
              <span className="font-bold text-green-700">The Green Way</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              South West England
            </p>
            <p className="text-sm text-gray-400">© 2026 The Green Way</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
