import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-medium leading-none tracking-tight text-white', className)} {...props}>
      {children}
    </h3>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * @typedef {{ label: string, currentValue: number, previousValue: number }} ChartDataPoint
 */

/**
 * @typedef {React.HTMLAttributes<HTMLDivElement> & {
 *   title: string,
 *   icon: React.ReactNode,
 *   mainValue: string,
 *   changeValue: number,
 *   changeDescription: string,
 *   chartData: ChartDataPoint[],
 *   onActionClick?: () => void,
 *   primaryBarClassName?: string,
 *   secondaryBarClassName?: string,
 *   chartAxisDensity?: 'default' | 'compact',
 *   sportShell?: boolean,
 * }} ActivityStatsCardProps
 */

const ActivityStatsCard = React.forwardRef(function ActivityStatsCard(
  {
    className,
    title,
    icon,
    mainValue,
    changeValue,
    changeDescription,
    chartData,
    onActionClick,
    primaryBarClassName,
    secondaryBarClassName,
    chartAxisDensity = 'default',
    sportShell = false,
    ...props
  },
  ref
) {
  const ChangeIndicator = changeValue > 0 ? ArrowUpRight : ArrowDownRight;
  const changeColor =
    changeValue > 0 ? 'text-emerald-400' : changeValue < 0 ? 'text-red-400' : 'text-slate-400';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.12 },
    },
  };

  const barVariants = {
    hidden: { height: '0%', opacity: 0 },
    visible: (height) => ({
      height: `${Math.min(100, Math.max(4, height))}%`,
      opacity: 1,
      transition: { type: 'spring', stiffness: 320, damping: 26 },
    }),
  };

  const shellClass = sportShell
    ? 'border-2 border-[#0F4C5C]/75 bg-black text-slate-50 shadow-lg shadow-black/40'
    : 'border border-slate-700/80 bg-slate-900/85 text-slate-50 shadow-lg backdrop-blur-md';

  return (
    <div
      ref={ref}
      className={cn('w-full max-w-sm overflow-hidden rounded-xl', shellClass, className)}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn('shrink-0', sportShell ? 'text-teal-400' : 'text-violet-400')}>{icon}</div>
            <CardTitle className="truncate text-base font-semibold md:text-lg">{title}</CardTitle>
          </div>
          {onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Voir détails"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-white md:text-4xl">{mainValue}</p>
        <div className={cn('mt-1 flex items-center gap-1 text-sm', changeColor)}>
          <ChangeIndicator className="h-4 w-4 shrink-0" />
          <span>
            {Math.abs(changeValue).toFixed(1)}%{' '}
            <span className="text-slate-500">{changeDescription}</span>
          </span>
        </div>

        <div
          className={cn(
            'mt-5 w-full',
            chartAxisDensity === 'compact' ? 'h-28 pb-1' : 'h-32'
          )}
        >
          <AnimatePresence>
            <motion.div
              key={chartData.map((p) => p.label).join('|')}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'flex h-full w-full items-end justify-between',
                chartAxisDensity === 'compact' ? 'gap-0.5 px-0.5' : 'gap-1 sm:gap-2'
              )}
            >
              {(chartData || []).map((point) => (
                <div
                  key={point.label}
                  className={cn(
                    'flex h-full min-w-0 flex-1 flex-col items-center justify-end',
                    chartAxisDensity === 'compact' ? 'gap-0' : 'gap-1'
                  )}
                >
                  <div className="relative flex h-full w-full items-end justify-center gap-0.5 sm:gap-1">
                    <motion.div
                      custom={point.currentValue}
                      variants={barVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn('w-full max-w-[14px] rounded-sm bg-violet-500 sm:max-w-[18px]', primaryBarClassName)}
                      aria-hidden
                    />
                    <motion.div
                      custom={point.previousValue}
                      variants={barVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        'w-full max-w-[14px] rounded-sm bg-violet-900/90 sm:max-w-[18px]',
                        secondaryBarClassName
                      )}
                      aria-hidden
                    />
                  </div>
                  <span
                    title={point.label}
                    className={cn(
                      chartAxisDensity === 'compact'
                        ? 'mt-0.5 line-clamp-2 max-h-[2.75rem] w-full px-0.5 text-center text-[8px] leading-[1.05] tracking-tight text-slate-500 [word-break:break-word]'
                        : 'truncate text-[10px] text-slate-500 sm:text-xs'
                    )}
                  >
                    {point.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </div>
  );
});

ActivityStatsCard.displayName = 'ActivityStatsCard';

export { ActivityStatsCard };
