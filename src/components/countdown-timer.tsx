"use client";

import { useState, useEffect } from "react";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const endDate = new Date("2025-11-30T23:59:59");

    const timer = setInterval(() => {
      const now = new Date();
      const distance = endDate.getTime() - now.getTime();

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({
          days: days.toString().padStart(2, "0"),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center space-x-2 md:space-x-4 mt-2">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold font-mono bg-background text-primary p-2 rounded-lg">
          {timeLeft.days}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Dias</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold font-mono bg-background text-primary p-2 rounded-lg">
          {timeLeft.hours}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Horas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold font-mono bg-background text-primary p-2 rounded-lg">
          {timeLeft.minutes}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Minutos</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold font-mono bg-background text-primary p-2 rounded-lg">
          {timeLeft.seconds}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Segundos</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
