import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",

        /// Custom badge variants ///
        "role-hk": "text-sky-600 border-sky-200 bg-sky-50",
        "role-maint": "text-orange-600 border-orange-200 bg-orange-50",
        overdue: "bg-red-50 border-red-200 text-red-600",
        "due-date": "bg-slate-50 text-slate-500 border-slate-200",
        todo: "text-orange-700 border-orange-200 bg-orange-50",
        inprogress: "bg-blue-50 border-blue-200 text-blue-700",
        done: "bg-green-50 border-green-200 text-green-700",
        cancelled: "bg-red-50 border-red-200 text-red-600",
        unassigned: "bg-amber-50 border-amber-200 text-amber-600",
        "prio-l":
          "bg-white text-[#0A0A0A] border-slate-200 [&_svg]:text-[#51A2FF] [&_svg]:fill-[#51A2FF]",
        "prio-m":
          "bg-white text-[#0A0A0A] border-slate-200 [&_svg]:text-[#FFB900] [&_svg]:fill-[#FFB900]",
        "prio-h":
          "bg-white text-[#0A0A0A] border-slate-200 [&_svg]:text-[#FB2C36] [&_svg]:fill-[#FB2C36]",
      },
      size: {
        default:
          "px-[4px] py-[10px] text-[12px] rounded-[8px] [&>svg]:size-[12px]!",
        sm: "px-[2px] py-[6px] text-[10px] rounded-[4px] [&>svg]:size-[10px]!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        variant: [
          "role-hk",
          "role-maint",
          "overdue",
          "due-date",
          "todo",
          "inprogress",
          "done",
          "cancelled",
          "prio-l",
          "prio-m",
          "prio-h",
        ],
        class: "h-auto px-[6px] py-[2px]",
      },
      {
        variant: ["prio-l", "prio-m", "prio-h"],
        class: "[&>svg]:size-[6px]!",
      },
    ],
  },
);

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
