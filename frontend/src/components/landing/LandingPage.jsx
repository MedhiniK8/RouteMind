import { motion } from "framer-motion";
import { ArrowRight, Bell, BrainCircuit, Clock, MapPinned, ShieldCheck, UsersRound, Wifi } from "lucide-react";
import Layout from "../layout/Layout";

function BubbleField() {
  return (
    <div className="bubble-field">
      {Array.from({ length: 14 }).map((_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 9) % 100}%`,
            bottom: `${-80 + index * 8}px`,
            width: `${28 + (index % 5) * 16}px`,
            height: `${28 + (index % 5) * 16}px`,
            animationDelay: `${index * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}

function StoryParagraph({ firstWord, children }) {
  return (
    <p className="story-paragraph">
      <span className="highlight-word">{firstWord}</span> {children}
    </p>
  );
}

export default function LandingPage() {
  const features = [
    ["Live Tracking", "Smooth moving buses, stops, routes, and real-time WebSocket updates.", MapPinned],
    ["AI ETA", "Distance, speed, delay status, and route progress combine into practical arrival estimates.", BrainCircuit],
    ["Smart Presence", "GPS consistency checks confirm whether a student is actually onboard.", ShieldCheck],
    ["SOS Priority", "Emergency alerts jump to the top of the management dashboard instantly.", Bell],
    ["Driver Coordination", "Trip start, delay updates, instructions, and accessibility mode in one place.", Wifi],
    ["Fleet Analytics", "Punctuality, late buses, usage, and accessibility visibility for admins.", Clock],
  ];

  const flows = [
    ["Student", "Login, view the assigned bus, check ETA, verify onboard presence, and send SOS if needed."],
    ["Driver", "Start the trip, share GPS, report delay, toggle accessible bus mode, and receive admin instructions."],
    ["Admin", "Track the whole fleet, resolve SOS alerts, edit routes, and send live driver instructions."],
  ];

  return (
    <Layout>
      <section id="home" className="relative overflow-hidden">
        <BubbleField />
        <div className="section grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-coral">
              AI-powered smart college bus tracking
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Know the bus. Trust the ETA. Manage every route with clarity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              RouteMind brings students, drivers, and admins into one real-time transport command center.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/login" className="soft-button bg-brand text-white">
                Try Demo Login <ArrowRight size={18} />
              </a>
              <a href="#about" className="soft-button bg-white text-ink">
                Explore System
              </a>
            </div>
          </motion.div>

          <div className="relative min-h-[440px]">
            <img
              className="h-[440px] w-full rounded-lg object-cover shadow-soft"
              src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80"
              alt="College shuttle bus on a city road"
            />
            <div className="floating-ui absolute left-4 top-6 rounded-lg bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-slate-500">ETA</p>
              <p className="text-3xl font-extrabold text-brand">8 min</p>
            </div>
            <div className="floating-ui absolute bottom-6 right-4 rounded-lg bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-slate-500">Presence</p>
              <p className="text-lg font-extrabold text-leaf">Onboard confirmed</p>
            </div>
            <div className="floating-ui absolute right-8 top-24 rounded-lg bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-slate-500">Speed</p>
              <p className="text-2xl font-extrabold text-coral">28 km/h</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">About RouteMind</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Simple transport visibility for busy campuses.</h2>
          </div>
          <div className="grid gap-6">
            <StoryParagraph firstWord="RouteMind">
              replaces uncertain waiting with live bus locations, route context, alerts, ETA prediction, and emergency coordination.
            </StoryParagraph>
            <StoryParagraph firstWord="Students">
              see when to leave for the pickup point, while drivers and admins coordinate delays, routes, and safety events in real time.
            </StoryParagraph>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-16">
        <div className="section">
          <h2 className="text-3xl font-extrabold text-ink">Features</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, text, Icon]) => (
              <motion.div whileHover={{ y: -6 }} key={title} className="rounded-lg border border-slate-200 bg-paper p-6">
                <Icon className="text-brand" size={30} />
                <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section py-16">
        <h2 className="text-3xl font-extrabold text-ink">How It Works</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {flows.map(([title, text], index) => (
            <div key={title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 font-extrabold text-brand">
                {index + 1}
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Contact / Connect with us</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink">Bring RouteMind to your campus demo.</h2>
            <p className="mt-4 text-slate-600">Use the sample accounts on the login page and run a complete student, driver, and admin story.</p>
          </div>
          <div className="card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-lg border border-slate-200 px-4 py-3" placeholder="Name" />
              <input className="rounded-lg border border-slate-200 px-4 py-3" placeholder="Email" />
              <textarea className="min-h-28 rounded-lg border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Message" />
            </div>
            <button className="soft-button mt-4 bg-brand text-white">
              Connect with us <UsersRound size={18} />
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
