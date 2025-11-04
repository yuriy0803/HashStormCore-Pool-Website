// src/components/Brand.tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  withText?: boolean;
  size?: number; // icon
  textClassName?: string;
  href?: string | null; // if no link, set null
};

export default function Brand({
  withText = true,
  size = 32,
  textClassName = "font-bold tracking-wide",
  href = "/",
}: Props) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/favicon.png"
        alt="HashStorm"
        width={size}
        height={size}
        priority
      />
      {withText && <span className={textClassName}>HASHSTORM</span>}
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
