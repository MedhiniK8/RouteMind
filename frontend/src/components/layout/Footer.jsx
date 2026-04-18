import { BusFront, Facebook, Instagram, Linkedin, Mail, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-950 text-white">
      <div className="section grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-xl font-extrabold">
            <span className="rounded-lg bg-white p-2 text-brand">
              <BusFront size={22} />
            </span>
            RouteMind
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            AI-powered college transport visibility for students, drivers, and management teams.
          </p>
        </div>
        <div>
          <h4 className="font-bold">About RouteMind</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>About App</li>
            <li>Features</li>
            <li>How It Works</li>
            <li>Analytics</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold">Support</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Privacy Policy</li>
            <li>Contact Us</li>
            <li>Emergency Support</li>
            <li>Copyright &copy; RouteMind</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold">Connect with us</h4>
          <div className="mt-4 flex gap-3">
            {[Facebook, Twitter, Instagram, Linkedin, Mail].map((Icon, index) => (
              <span key={index} className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20">
                <Icon size={18} />
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-300">support@routemind.dev</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-sm text-slate-400">
        Copyright &copy; RouteMind. All rights reserved.
      </div>
    </footer>
  );
}
