import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",

        /// Custom button variants ///

        // Bordered variants
        "border-blue":
          "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 [&_svg]:text-[#2b7fff]",
        "border-amber":
          "border-amber-200 bg-amber-50 text-amber-800 hover:bg-yellow-100 [&_svg]:text-[##FE9A00]",
        "border-green":
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 [&_svg]:text-[#00BC7D]",
        "border-gray":
          "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 [&_svg]:text-[#90A1B9]",
        "border-red":
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 [&_svg]:text-[##FF6467]",

        // Solid variants
        "solid-violet": "bg-violet-600 text-white hover:bg-violet-700",
        "solid-blue": "bg-blue-600 text-white hover:bg-blue-700",

        // Pill / filter variants (full-rounded)
        pill: "border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50",
        "pill-blue": "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
        "pill-slate":
          "border-slate-700 bg-slate-700 text-white hover:bg-slate-800",
        "pill-violet": "bg-violet-600 text-white hover:bg-violet-700",
        "pill-green": "bg-emerald-600 text-white hover:bg-emerald-700",
        "pill-red": "bg-red-500 text-white hover:bg-red-600",
        "pill-yellow": "bg-yellow-500 text-white hover:bg-yellow-600",

        // Ghost variants
        "ghost-violet": "hover:bg-violet-50 text-violet-700",
        "ghost-blue": "hover:bg-blue-50 text-blue-700",
      },
      size: {
        default:
          "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    compoundVariants: [
      {
        variant: [
          "default",
          "secondary",
          "outline",
          "destructive",
          "link",
          "border-blue",
          "border-amber",
          "border-green",
          "border-gray",
          "border-red",
          "solid-violet",
          "solid-blue",
        ],
        class: "rounded-2xl px-4 py-3.5 h-auto gap-3",
      },
      {
        variant: [
          "pill",
          "pill-blue",
          "pill-slate",
          "pill-violet",
          "pill-green",
          "pill-red",
          "pill-yellow",
        ],
        class:
          "px-3 py-1.5 h-auto gap-1.5 font-bold text-xs rounded-full w-min [&_svg]:size-3!",
      },
      {
        variant: ["ghost-violet", "ghost-blue"],
        class: "h-auto p-2",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
