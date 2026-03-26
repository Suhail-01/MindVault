"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

export const TextHoverEffect = ({
  text,
  duration,
  automatic = false,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (automatic) {
      let angle = 0;
      const interval = setInterval(() => {
        angle += 0.05;
        const cx = 50 + 40 * Math.cos(angle);
        const cy = 50 + 40 * Math.sin(angle);
        setMaskPosition({
          cx: `${cx}%`,
          cy: `${cy}%`,
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [automatic]);

  useEffect(() => {
    if (!automatic && svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor, automatic]);

  const isVisible = hovered || automatic;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {isVisible && (
            <>
              <stop offset="0%" stopColor="#00FFFF">
                <animate attributeName="stop-color" values="#00FFFF;#FF00FF;#FFFF00;#00FF00;#00FFFF" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="25%" stopColor="#FF00FF">
                <animate attributeName="stop-color" values="#FF00FF;#FFFF00;#00FF00;#00FFFF;#FF00FF" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#FFFF00">
                <animate attributeName="stop-color" values="#FFFF00;#00FF00;#00FFFF;#FF00FF;#FFFF00" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="75%" stopColor="#00FF00">
                <animate attributeName="stop-color" values="#00FF00;#00FFFF;#FF00FF;#FFFF00;#00FF00" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#FFFFFF">
                <animate attributeName="stop-color" values="#FFFFFF;#00FFFF;#FF00FF;#FFFF00;#FFFFFF" dur="5s" repeatCount="indefinite" />
              </stop>
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="40%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-200 font-[helvetica] text-7xl font-bold dark:stroke-neutral-800"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-200 font-[helvetica] text-7xl font-bold dark:stroke-neutral-800"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.5"
        mask="url(#textMask)"
        filter="url(#glow)"
        className="fill-transparent font-[helvetica] text-7xl font-bold"
      >
        {text}
      </text>
    </svg>
  );
};
