import { useEffect, useState } from "react";
import { useLocation } from "react-router";

export function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show and reset progress on route change
    setVisible(true);
    setProgress(15);

    const timer1 = setTimeout(() => setProgress(40), 60);
    const timer2 = setTimeout(() => setProgress(70), 140);
    const timer3 = setTimeout(() => setProgress(88), 220);
    const timer4 = setTimeout(() => {
      setProgress(100);
      const fadeTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 120);
      return () => clearTimeout(fadeTimer);
    }, 280);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-emerald-brand/10"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-brand via-emerald-brand to-teal-400 transition-all ease-out duration-250 shadow-[0_1.5px_8px_rgba(5,150,105,0.7)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
