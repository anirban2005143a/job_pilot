import { BriefcaseBusiness } from "lucide-react";

export function SignupLayout({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  return (
    <main className="shell">
      <div className="auth-layout">
        <aside className="intro">
          <Brand />
          <div className="intro-copy">
            <div className="eyebrow">CAREER, ORGANIZED</div>
            <h1>A calmer way to move your career forward.</h1>
            <p>
              Bring your experience together once. JobPilot helps you stay ready
              for the opportunities that fit.
            </p>
          </div>
          <div className="quote">
            <span>“</span>
            <p>
              The details matter. Your profile should do more of the talking.
            </p>
          </div>
        </aside>
        <section className="work-area">
          <div className="mobile-brand brand">
            <Brand />
          </div>
          {step > 0 && (
            <div className="progress">
              <div className="progress-line">
                <span style={{ width: `${step * 25}%` }} />
              </div>
              <div className="progress-labels">
                {["Account", "Resume", "Profile", "Preferences"].map(
                  (label, index) => (
                    <span
                      className={
                        step > index
                          ? "done"
                          : step === index + 1
                            ? "current"
                            : ""
                      }
                      key={label}
                    >
                      {step > index && "✓ "}
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <BriefcaseBusiness size={18} />
      </span>{" "}
      jobpilot
    </div>
  );
}
