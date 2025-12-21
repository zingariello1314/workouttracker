"use client";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Sparkles as SparklesComp } from "../ui/sparkles";
import { TimelineContent } from "../ui/timeline-animation";
import {VerticalCutReveal} from "../ui/vertical-cut-reveal";
import { cn } from "../../utils/cn";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useWorkout } from "../../context/WorkoutContext";
import { ArrowLeft } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description:
      "Great for small businesses and startups looking to get started with AI",
    price: 12,
    yearlyPrice: 99,
    buttonText: "Get started",
    buttonVariant: "outline",
    includes: [
      "Free includes:",
      "Unlimted Cards",
      "Custom background & stickers",
      "2-factor authentication",
    ],
  },
  {
    name: "Business",
    description:
      "Best value for growing businesses that need more advanced features",
    price: 48,
    yearlyPrice: 399,
    buttonText: "Get started",
    buttonVariant: "default",
    popular: true,
    includes: [
      "Everything in Starter, plus:",
      "Advanced checklists",
      "Custom fields",
      "Servedless functions",
    ],
  },
  {
    name: "Enterprise",
    description:
      "Advanced plan with enhanced security and unlimited access for large teams",
    price: 96,
    yearlyPrice: 899,
    buttonText: "Get started",
    buttonVariant: "outline",
    includes: [
      "Everything in Business, plus:",
      "Multi-board management",
      "Multi-board guest",
      "Attachment permissions",
    ],
  },
];

const PricingSwitch = ({ onSwitch }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-neutral-900 border border-gray-700 p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 w-fit h-10  rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors",
            selected === "0" ? "text-white" : "text-gray-200",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors",
            selected === "1" ? "text-white" : "text-gray-200",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full  rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">Yearly</span>
        </button>
      </div>
    </div>
  );
};

export default function PricingTab() {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef(null);
  const { setActiveTab, previousTab } = useWorkout();

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <div
      className="w-full min-h-screen mx-auto relative bg-black overflow-x-hidden overflow-y-auto"
      ref={pricingRef}
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="fixed top-0 left-0 h-screen w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] pointer-events-none z-0"
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px] "></div>
        <SparklesComp
          density={1800}
          direction="bottom"
          speed={1}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>
      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="fixed left-0 top-0 w-full h-full flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0 pointer-events-none"
      >
        <div className="framer-1i5axl2">
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
            data-border="true"
            data-framer-name="Ellipse 1"
          ></div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
            data-border="true"
            data-framer-name="Ellipse 2"
          ></div>
        </div>
      </TimelineContent>

      {/* Bouton Retour */}
      <div className="absolute top-6 left-4 sm:left-6 z-50">
        <button
          onClick={() => setActiveTab(previousTab || 'home')}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm border border-slate-700 rounded-lg text-white transition-all duration-200 hover:border-slate-600 shadow-lg hover:shadow-xl hover:scale-105"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
      </div>

      <article className="text-center mb-2 pt-32 pb-2 max-w-3xl mx-auto space-y-3 px-4 relative z-50">
        <h2 className="text-4xl md:text-5xl font-medium text-white leading-tight">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center "
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Plans that works best for your
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
        >
          Trusted by millions, We help teams all around the world, Explore which
          option is right for you.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
        >
          <PricingSwitch onSwitch={togglePricingPeriod} />
        </TimelineContent>
      </article>

      <div
        className="fixed top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
        radial-gradient(circle at center, #206ce8 0%, transparent 70%)
      `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="grid md:grid-cols-3 max-w-5xl gap-6 py-2 pt-2 px-4 sm:px-6 lg:px-8 mx-auto relative z-50 pb-20 items-stretch">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="h-full flex"
          >
            <div className="relative h-full w-full flex flex-col">
            <Card
              className={`relative text-white border-neutral-800 h-full flex flex-col overflow-visible ${
                plan.popular
                  ? "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 shadow-[0px_-13px_300px_0px_#0900ff] z-20"
                  : "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 z-10"
              } transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-neutral-700`}
            >
              <CardHeader className="text-left pb-4 pt-6 !border-b-0 flex flex-col" style={{ minHeight: plan.popular ? '220px' : '180px' }}>
                {plan.popular && (
                  <div className="flex justify-center mb-4 h-8">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/50 animate-pulse whitespace-nowrap">
                      ⭐ Populaire
                    </span>
                  </div>
                )}
                {!plan.popular && <div className="h-8 mb-4"></div>}
                <div className="flex justify-between items-start mb-4 min-h-[40px]">
                  <h3 className="text-3xl mb-0 font-bold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline mb-4 min-h-[60px]">
                  <span className="text-5xl font-bold text-white">
                    $
                    <NumberFlow
                      format={{
                        currency: "USD",
                      }}
                      value={isYearly ? plan.yearlyPrice : plan.price}
                      className="text-5xl font-bold"
                    />
                  </span>
                  <span className="text-gray-400 ml-2 text-lg font-medium">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-0 leading-relaxed min-h-[60px]">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0 pb-6 flex-1 flex flex-col">
                <div className="flex-1 min-h-[100px]"></div>
                <button
                  className={`w-full mb-6 p-4 text-lg sm:text-xl rounded-xl font-semibold transition-all duration-200 cursor-pointer min-h-[60px] ${
                    plan.popular
                      ? "bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-800 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-900 transform hover:scale-105 active:scale-95"
                      : plan.buttonVariant === "outline"
                        ? "bg-gradient-to-t from-neutral-950 to-neutral-600 shadow-lg shadow-neutral-900 text-white hover:from-neutral-900 hover:to-neutral-700 transform hover:scale-105 active:scale-95"
                        : "bg-gradient-to-t from-neutral-950 to-neutral-600 shadow-lg shadow-neutral-900 text-white hover:from-neutral-900 hover:to-neutral-700 transform hover:scale-105 active:scale-95"
                  }`}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-3 pt-4 min-h-[180px]">
                  <h4 className="font-medium text-base mb-4 text-white min-h-[24px]">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-3">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 shadow-sm shadow-blue-500/50"></span>
                        <span className="text-sm text-gray-300 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            </div>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}

