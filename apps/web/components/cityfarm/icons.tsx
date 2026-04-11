import React from "react";

interface IconProps {
  style?: React.CSSProperties;
  className?: string;
  filled?: boolean;
}

function baseIcon(children: React.ReactNode, props: IconProps = {}) {
  const { filled, ...svgProps } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
      {...svgProps}
    >
      {children}
    </svg>
  );
}

export function HomeIcon() {
  return baseIcon(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </>
  );
}

export function BagIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>,
    props
  );
}

export function SproutIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="M12 20v-8" />
      <path d="M12 12c0-4-2.5-6-6-6 0 4 2.5 6 6 6Z" />
      <path d="M12 12c0-4 2.5-6 6-6 0 4-2.5 6-6 6Z" />
    </>,
    props
  );
}

export function UsersIcon() {
  return baseIcon(
    <>
      <path d="M7.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M3.5 19c0-2.2 1.8-4 4-4h1" />
      <path d="M20.5 19c0-2.2-1.8-4-4-4h-1" />
      <path d="M8.5 19c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5" />
    </>
  );
}

export function CameraIcon() {
  return baseIcon(
    <>
      <path d="M4 7h3l1.4-2h7.2L17 7h3v11H4V7Z" />
      <circle cx="12" cy="12.5" r="3.25" />
    </>
  );
}

export function DropletIcon() {
  return baseIcon(
    <>
      <path d="M12 3c3 4 5 6.6 5 9.3A5 5 0 0 1 7 12.3C7 9.6 9 7 12 3Z" />
    </>
  );
}

export function SunIcon() {
  return baseIcon(
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
    </>
  );
}

export function CheckIcon() {
  return baseIcon(<path d="m5 12 4 4 10-10" />);
}

export function ClockIcon() {
  return baseIcon(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 1.8" />
    </>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="M14.5 5 8 11.5 14.5 18" />
      <path d="M9 11.5h10" />
    </>,
    props
  );
}



export function SparkleIcon() {
  return baseIcon(
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
      <path d="m18.5 14 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
      <path d="m5.5 14 .9 2.7 2.6.9-2.6.9-.9 2.7-.9-2.7-2.6-.9 2.6-.9.9-2.7Z" />
    </>
  );
}

export function TrashIcon() {
  return baseIcon(
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 3.5h5l.5 2h-6l.5-2Z" />
      <path d="M6.5 7 7.3 19h9.4L17.5 7" />
    </>
  );
}

export function PlusIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>,
    props
  );
}

export function SearchIcon() {
  return baseIcon(
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
      style={props.style}
      className={props.className}
    >
      <path d="M12 20.4 4.8 13.3A4.6 4.6 0 1 1 11.3 6.8L12 7.6l.7-.8a4.6 4.6 0 1 1 6.5 6.5L12 20.4Z" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return baseIcon(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.2a2.5 2.5 0 1 1 4.4 1.6c-.8.7-1.5 1-1.5 2.2" />
      <circle cx="12" cy="16.8" r=".5" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function ImageIcon(props: IconProps) {
  return baseIcon(
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.2" />
      <path d="m20 15-4-4-6 6-2-2-4 4" />
    </>,
    props
  );
}

export function PinIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="M12 20s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9Z" />
      <circle cx="12" cy="11" r="1.8" />
    </>,
    props
  );
}

export function CloudIcon() {
  return baseIcon(
    <>
      <path d="M7 18h9a4 4 0 0 0 .3-8 5 5 0 0 0-9.5 1.4A3.5 3.5 0 0 0 7 18Z" />
    </>
  );
}

export function RecycleIcon() {
  return baseIcon(
    <>
      <path d="m9 5 2-2 2 2" />
      <path d="M11 3v5l-2 2" />
      <path d="m15 19-2 2-2-2" />
      <path d="M13 21v-5l2-2" />
      <path d="m4 12 2-2 2 2" />
      <path d="M6 10h5l2 2" />
    </>
  );
}

export function CloseIcon(props: IconProps) {
  return baseIcon(
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>,
    props
  );
}
