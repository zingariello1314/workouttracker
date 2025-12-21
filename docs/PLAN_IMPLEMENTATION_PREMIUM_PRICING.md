# Plan d'Implémentation - Abonnement Premium & Page Pricing

## 📋 Vue d'ensemble

Ce document détaille l'implémentation complète pour :
1. Ajouter un bouton "Passer à l'abonnement premium" dans la page de connexion (AuthPage)
2. Ajouter un bouton "Passer à l'abonnement premium" dans la section "MON PROFIL" des paramètres (SettingsTab)
3. Créer une page de pricing premium avec animations et effets visuels
4. Configurer le routing pour naviguer vers la page pricing

---

## 🎯 Objectifs

- ✅ Intégrer un bouton premium dans `AuthPage.jsx` (carte de gauche, section informative)
- ✅ Intégrer un bouton premium dans `SettingsTab.jsx` (section "MON PROFIL", après le changement de mot de passe)
- ✅ Créer une nouvelle page `PricingPage.jsx` basée sur le code de `docs/pagepricing.md`
- ✅ Créer les composants UI manquants (TimelineContent, VerticalCutReveal, Sparkles)
- ✅ Installer les dépendances npm nécessaires
- ✅ Configurer le routing dans `App.jsx` pour l'onglet `pricing`

---

## 📦 Étape 1 : Installation des dépendances

### 1.1 Dépendances à installer

```bash
npm install motion @number-flow/react @tsparticles/slim @tsparticles/react
```

**Note :** `framer-motion` est déjà installé (version 12.23.25), mais le code utilise `motion/react` qui est la nouvelle API. Vérifier la compatibilité.

**Alternative si `motion/react` ne fonctionne pas :**
- Utiliser `framer-motion` directement (remplacer `import { motion } from "motion/react"` par `import { motion } from "framer-motion"`)

### 1.2 Vérification des dépendances existantes

Dépendances déjà présentes dans `package.json` :
- ✅ `framer-motion`: ^12.23.25
- ✅ `react`: ^18.2.0
- ✅ `react-dom`: ^18.2.0
- ✅ `lucide-react`: ^0.263.1 (pour les icônes)

---

## 🧩 Étape 2 : Création des composants UI manquants

### 2.1 Créer `src/components/ui/sparkles.jsx`

**Fichier :** `src/components/ui/sparkles.jsx`

```jsx
"use client"

import { useEffect, useId, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  options = {},
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setIsReady(true)
    })
  }, [])

  const id = useId()

  const defaultOptions = {
    background: {
      color: {
        value: background,
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 1,
    },
    fpsLimit: 120,
    particles: {
      color: {
        value: color,
      },
      move: {
        enable: true,
        direction: "none",
        speed: {
          min: minSpeed || speed / 10,
          max: speed,
        },
        straight: false,
      },
      number: {
        value: density,
      },
      opacity: {
        value: {
          min: minOpacity || opacity / 10,
          max: opacity,
        },
        animation: {
          enable: true,
          sync: false,
          speed: opacitySpeed,
        },
      },
      size: {
        value: {
          min: minSize || size / 2.5,
          max: size,
        },
      },
    },
    detectRetina: true,
  }

  return isReady && <Particles id={id} options={{ ...defaultOptions, ...options }} className={className} />
}
```

### 2.2 Créer `src/components/ui/timeline-animation.jsx`

**Fichier :** `src/components/ui/timeline-animation.jsx`

```jsx
"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export function TimelineContent({
  as: Component = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    if (!timelineRef?.current || !elementRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    observer.observe(elementRef.current)

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [timelineRef])

  return (
    <Component
      ref={elementRef}
      className={className}
      {...props}
    >
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={customVariants}
        custom={animationNum}
      >
        {children}
      </motion.div>
    </Component>
  )
}
```

### 2.3 Créer `src/components/ui/vertical-cut-reveal.jsx`

**Fichier :** `src/components/ui/vertical-cut-reveal.jsx`

```jsx
'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { motion } from "framer-motion"
import { cn } from "../../utils/cn"

interface TextProps {
  children: React.ReactNode
  reverse?: boolean
  transition?: any
  splitBy?: "words" | "characters" | "lines" | string
  staggerDuration?: number
  staggerFrom?: "first" | "last" | "center" | "random" | number
  containerClassName?: string
  wordLevelClassName?: string
  elementLevelClassName?: string
  onClick?: () => void
  onStart?: () => void
  onComplete?: () => void
  autoStart?: boolean
}

export interface VerticalCutRevealRef {
  startAnimation: () => void
  reset: () => void
}

interface WordObject {
  characters: string[]
  needsSpace: boolean
}

const VerticalCutReveal = forwardRef<VerticalCutRevealRef, TextProps>(
  (
    {
      children,
      reverse = false,
      transition = {
        type: "spring",
        stiffness: 190,
        damping: 22,
      },
      splitBy = "words",
      staggerDuration = 0.2,
      staggerFrom = "first",
      containerClassName,
      wordLevelClassName,
      elementLevelClassName,
      onClick,
      onStart,
      onComplete,
      autoStart = true,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef(null)
    const text = typeof children === "string" ? children : children?.toString() || ""
    const [isAnimating, setIsAnimating] = useState(false)

    // Разделение текста на символы с поддержкой Unicode и эмодзи
    const splitIntoCharacters = (text) => {
      if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
        return Array.from(segmenter.segment(text), ({ segment }) => segment)
      }
      return Array.from(text)
    }

    // Разделение текста на основе параметра splitBy
    const elements = useMemo(() => {
      const words = text.split(" ")
      if (splitBy === "characters") {
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1,
        }))
      }
      return splitBy === "words"
        ? text.split(" ")
        : splitBy === "lines"
          ? text.split("\n")
          : text.split(splitBy)
    }, [text, splitBy])

    // Расчет задержек для эффекта stagger
    const getStaggerDelay = useCallback(
      (index) => {
        const total =
          splitBy === "characters"
            ? elements.reduce(
                (acc, word) =>
                  acc +
                  (typeof word === "string"
                    ? 1
                    : word.characters.length + (word.needsSpace ? 1 : 0)),
                0
              )
            : elements.length
        if (staggerFrom === "first") return index * staggerDuration
        if (staggerFrom === "last") return (total - 1 - index) * staggerDuration
        if (staggerFrom === "center") {
          const center = Math.floor(total / 2)
          return Math.abs(center - index) * staggerDuration
        }
        if (staggerFrom === "random") {
          const randomIndex = Math.floor(Math.random() * total)
          return Math.abs(randomIndex - index) * staggerDuration
        }
        return Math.abs(staggerFrom - index) * staggerDuration
      },
      [elements.length, staggerFrom, staggerDuration, splitBy]
    )

    const startAnimation = useCallback(() => {
      setIsAnimating(true)
      onStart?.()
    }, [onStart])

    useImperativeHandle(ref, () => ({
      startAnimation,
      reset: () => setIsAnimating(false),
    }))

    useEffect(() => {
      if (autoStart) {
        startAnimation()
      }
    }, [autoStart, startAnimation])

    const variants = {
      hidden: { y: reverse ? "-100%" : "100%" },
      visible: (i) => ({
        y: 0,
        transition: {
          ...transition,
          delay: ((transition?.delay) || 0) + getStaggerDelay(i),
        },
      }),
    }

    return (
      <span
        className={cn(
          containerClassName,
          "flex flex-wrap whitespace-pre-wrap",
          splitBy === "lines" && "flex-col"
        )}
        onClick={onClick}
        ref={containerRef}
        {...props}
      >
        <span className="sr-only">{text}</span>

        {(splitBy === "characters"
          ? (elements)
          : (elements).map((el, i) => ({
              characters: [el],
              needsSpace: i !== elements.length - 1,
            }))
        ).map((wordObj, wordIndex, array) => {
          const previousCharsCount = array
            .slice(0, wordIndex)
            .reduce((sum, word) => sum + word.characters.length, 0)

          return (
            <span
              key={wordIndex}
              aria-hidden="true"
              className={cn("inline-flex overflow-hidden", wordLevelClassName)}
            >
              {wordObj.characters.map((char, charIndex) => (
                <span
                  className={cn(
                    elementLevelClassName,
                    "whitespace-pre-wrap relative"
                  )}
                  key={charIndex}
                >
                  <motion.span
                    custom={previousCharsCount + charIndex}
                    initial="hidden"
                    animate={isAnimating ? "visible" : "hidden"}
                    variants={variants}
                    onAnimationComplete={
                      wordIndex === elements.length - 1 &&
                      charIndex === wordObj.characters.length - 1
                        ? onComplete
                        : undefined
                    }
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                </span>
              ))}
              {wordObj.needsSpace && <span> </span>}
            </span>
          )
        })}
      </span>
    )
  }
)

VerticalCutReveal.displayName = "VerticalCutReveal"

export { VerticalCutReveal }
```

**Note :** La fonction `cn` n'existe pas encore dans le projet. Elle sera créée à l'étape 7.3.

---

## 📄 Étape 3 : Créer la page Pricing

### 3.1 Créer `src/components/tabs/PricingTab.jsx`

**Fichier :** `src/components/tabs/PricingTab.jsx`

```jsx
"use client";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Sparkles as SparklesComp } from "../ui/sparkles";
import { TimelineContent } from "../ui/timeline-animation";
import {VerticalCutReveal} from "../ui/vertical-cut-reveal";
import { cn } from "../../utils/cn";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Starter",
    description:
      "Great for small businesses and startups looking to get started with AI",
    price: 12,
    yearlyPrice: 99,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
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
    buttonVariant: "default" as const,
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
    buttonVariant: "outline" as const,
    includes: [
      "Everything in Business, plus:",
      "Multi-board management",
      "Multi-board guest",
      "Attachment permissions",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
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
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
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

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <div
      className=" min-h-screen  mx-auto relative bg-black overflow-x-hidden"
      ref={pricingRef}
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0  h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] "
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
        className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0"
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

      <article className="text-center mb-6 pt-32 max-w-3xl mx-auto space-y-2 relative z-50">
        <h2 className="text-4xl font-medium text-white">
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
          className="text-gray-300"
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
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0"
        style={{
          backgroundImage: `
        radial-gradient(circle at center, #206ce8 0%, transparent 70%)
      `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="grid md:grid-cols-3 max-w-5xl gap-4 py-6 mx-auto ">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={`relative text-white border-neutral-800 ${
                plan.popular
                  ? "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 shadow-[0px_-13px_300px_0px_#0900ff] z-20"
                  : "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 z-10"
              }`}
            >
              <CardHeader className="text-left ">
                <div className="flex justify-between">
                  <h3 className="text-3xl mb-2">{plan.name}</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-semibold ">
                    $
                    <NumberFlow
                      format={{
                        currency: "USD",
                      }}
                      value={isYearly ? plan.yearlyPrice : plan.price}
                      className="text-4xl font-semibold"
                    />
                  </span>
                  <span className="text-gray-300 ml-1">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <button
                  className={`w-full mb-6 p-4 text-xl rounded-xl ${
                    plan.popular
                      ? "bg-gradient-to-t from-blue-500 to-blue-600  shadow-lg shadow-blue-800 border border-blue-500 text-white"
                      : plan.buttonVariant === "outline"
                        ? "bg-gradient-to-t from-neutral-950 to-neutral-600  shadow-lg shadow-neutral-900 border border-neutral-800 text-white"
                        : ""
                  }`}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-3 pt-4 border-t border-neutral-700">
                  <h4 className="font-medium text-base mb-3">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-2">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-2"
                      >
                        <span className="h-2.5 w-2.5 bg-neutral-500 rounded-full grid place-content-center"></span>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}
```

**Note :** Les imports utilisent des chemins relatifs adaptés à la structure du projet. Vérifier que tous les chemins sont corrects.

---

## 🔗 Étape 4 : Ajouter le bouton dans AuthPage

### 4.1 Modifier `src/components/AuthPage.jsx`

**Localisation :** Dans la carte de gauche (Card avec les informations), après les bullet points.

**Code à ajouter :**

```jsx
// Après la ligne 127 (après le dernier <p> des bullet points)
<div className="mt-6 pt-4 border-t border-white/10">
  <Button
    onClick={() => setActiveTab('pricing')}
    variant="primary"
    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50"
  >
    ⭐ Passer à l'abonnement premium
  </Button>
</div>
```

**Import à ajouter en haut du fichier :**
- Vérifier que `Button` est déjà importé (ligne 5)
- Vérifier que `useWorkout` est déjà importé (ligne 3)

**Fichier complet modifié :**

```jsx
// ... existing code jusqu'à la ligne 127 ...

          <div className="space-y-3 text-xs text-slate-400">
            <p>
              • Données stockées localement en IndexedDB, sans envoi vers un serveur.
            </p>
            <p>
              • Tu pourras ensuite migrer toutes tes données existantes vers ce compte depuis l'onglet Paramètres.
            </p>
            {currentUser && (
              <p className="text-emerald-400">
                Connecté en tant que <span className="font-semibold">{currentUser.username}</span>.
              </p>
            )}
          </div>
          
          {/* ✅ NOUVEAU : Bouton Premium */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={() => setActiveTab('pricing')}
              variant="primary"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50"
            >
              ⭐ Passer à l'abonnement premium
            </Button>
          </div>
        </Card>

// ... existing code ...
```

---

## ⚙️ Étape 5 : Ajouter le bouton dans SettingsTab

### 5.1 Modifier `src/components/tabs/SettingsTab.jsx`

**Localisation :** Dans la section "MON PROFIL", après le bloc "Changer le mot de passe" (après la ligne 2340 environ).

**Code à ajouter :**

```jsx
              {/* ✅ NOUVEAU : Bouton Premium */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => setActiveTab('pricing')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
                >
                  <span>⭐</span>
                  <span>Passer à l'abonnement premium</span>
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  Débloquez toutes les fonctionnalités avancées de Momentum
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
```

**Import à vérifier :**
- `Button` est déjà importé (ligne 14)
- `useWorkout` est déjà importé (ligne 3) - `setActiveTab` est disponible via `const { setActiveTab } = useWorkout();`

**Fichier complet modifié (section MON PROFIL) :**

```jsx
// ... existing code jusqu'à la ligne 2339 ...

                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={passwordStatus === 'loading' || !oldPassword || !newPassword || !confirmPassword}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {passwordStatus === 'loading' ? 'Mise à jour...' : 'Changer le mot de passe'}
                  </Button>
                  {passwordError && (
                    <span className="text-xs text-red-400 block">{passwordError}</span>
                  )}
                  {passwordStatus === 'success' && (
                    <span className="text-xs text-emerald-400">✅ Mot de passe mis à jour avec succès</span>
                  )}
                </div>
              </div>

              {/* ✅ NOUVEAU : Bouton Premium */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => setActiveTab('pricing')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
                >
                  <span>⭐</span>
                  <span>Passer à l'abonnement premium</span>
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  Débloquez toutes les fonctionnalités avancées de Momentum
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

// ... existing code ...
```

**Note :** Vérifier que `setActiveTab` est bien disponible dans le scope. Si non, ajouter :
```jsx
const { setActiveTab } = useWorkout();
```

---

## 🗺️ Étape 6 : Configurer le routing dans App.jsx

### 6.1 Importer PricingTab

**Fichier :** `src/App.jsx`

**Ajouter l'import :**
```jsx
import PricingTab from './components/tabs/PricingTab';
```

**Localisation :** Après la ligne 31 (après `import DashboardTab`)

### 6.2 Ajouter le case dans renderTabContent

**Fichier :** `src/App.jsx`

**Ajouter dans la fonction `renderTabContent()` :**

```jsx
case 'pricing':
  return <PricingTab />;
```

**Localisation :** Après le case `'settings'` (ligne 202)

**Code complet modifié :**

```jsx
// ... existing code ...

      case 'settings':
        return <SettingsTab />;
      case 'pricing':
        return <PricingTab />;
      default:
        return <HomePage />;
    }
  };
```

---

## 🛠️ Étape 7 : Vérifications et corrections

### 7.1 Vérifier les imports dans PricingTab

**Les imports dans PricingTab.jsx sont déjà corrigés :**
- `../ui/Card` → Correct (Card.jsx existe et exporte CardHeader, CardContent)
- `../ui/sparkles` → À créer (étape 2.1)
- `../ui/timeline-animation` → À créer (étape 2.2)
- `../ui/vertical-cut-reveal` → À créer (étape 2.3)
- `../../utils/cn` → À créer (étape 7.3)

**Vérifier que Card.jsx exporte bien :**
Le fichier `src/components/ui/Card.jsx` exporte déjà :
- `Card` (composant principal)
- `CardHeader`
- `CardContent`
- `CardTitle`
- `CardFooter`

Les imports sont donc corrects.

### 7.2 Vérifier que Card exporte CardContent et CardHeader

**Fichier :** `src/components/ui/Card.jsx`

Vérifier que le fichier exporte bien :
- `Card`
- `CardHeader`
- `CardContent`

Si non, adapter les imports ou créer les composants manquants.

### 7.3 Créer la fonction `cn` dans utils

**Fichier :** `src/utils/cn.js`

**Créer le fichier avec :**

```js
/**
 * Fonction utilitaire pour combiner les classes CSS
 * Combine clsx et tailwind-merge pour gérer les conflits de classes Tailwind
 */

export function cn(...inputs) {
  // Version simple sans dépendances externes
  // Filtre les valeurs null/undefined et joint les classes
  return inputs
    .filter(Boolean)
    .map(input => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}
```

**Alternative avec dépendances (recommandée pour meilleure gestion des conflits Tailwind) :**

```bash
npm install clsx tailwind-merge
```

Puis dans `src/utils/cn.js` :

```js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**Note :** La version simple fonctionne mais ne gère pas les conflits de classes Tailwind (ex: `p-4` vs `p-6`). Pour une meilleure expérience, utiliser la version avec `tailwind-merge`.

### 7.4 Adapter motion/react si nécessaire

Si `motion/react` ne fonctionne pas, remplacer dans tous les fichiers :
```jsx
import { motion } from "framer-motion";
```

---

## 🎨 Étape 8 : Personnalisation (optionnel)

### 8.1 Adapter les textes en français

Dans `PricingTab.jsx`, remplacer :
- "Plans that works best for your" → "Plans qui fonctionnent le mieux pour vous"
- "Trusted by millions..." → "Fiable par des millions, Nous aidons les équipes du monde entier, Explorez quelle option vous convient."
- "Monthly" → "Mensuel"
- "Yearly" → "Annuel"
- "Get started" → "Commencer"
- Etc.

### 8.2 Adapter les prix et descriptions

Modifier l'array `plans` dans `PricingTab.jsx` selon vos besoins.

### 8.3 Ajouter des fonctionnalités

- Gérer le clic sur les boutons "Get started" (redirection vers un système de paiement)
- Ajouter un badge "Populaire" sur le plan Business
- Ajouter des animations supplémentaires

---

## ✅ Checklist finale

- [ ] Dépendances npm installées
- [ ] Composant `sparkles.jsx` créé
- [ ] Composant `timeline-animation.jsx` créé
- [ ] Composant `vertical-cut-reveal.jsx` créé
- [ ] Composant `PricingTab.jsx` créé
- [ ] Bouton premium ajouté dans `AuthPage.jsx`
- [ ] Bouton premium ajouté dans `SettingsTab.jsx`
- [ ] Routing configuré dans `App.jsx`
- [ ] Imports corrigés (chemins relatifs)
- [ ] Fonction `cn` créée dans `src/utils/cn.js`
- [ ] Card exporte CardContent et CardHeader
- [ ] Test de navigation vers la page pricing
- [ ] Test des animations et effets visuels
- [ ] Vérification responsive (mobile/desktop)

---

## 🐛 Dépannage

### Problème : Erreur "Cannot find module '@/components/ui/card'"
**Solution :** Remplacer tous les imports `@/` par des chemins relatifs.

### Problème : Erreur "motion/react not found"
**Solution :** Utiliser `framer-motion` directement : `import { motion } from "framer-motion"`

### Problème : Les animations ne fonctionnent pas
**Solution :** Vérifier que `framer-motion` est bien installé et que les variants sont correctement définis.

### Problème : Les particules Sparkles ne s'affichent pas
**Solution :** Vérifier que `@tsparticles/react` et `@tsparticles/slim` sont installés et que le composant est bien monté.

### Problème : Erreur "cn is not a function"
**Solution :** Créer le fichier `src/utils/cn.js` avec la fonction `cn` (voir étape 7.3).

---

## 📝 Notes importantes

1. **Performance :** Les animations et particules peuvent être lourdes. Tester sur différents appareils.

2. **Accessibilité :** Ajouter des attributs ARIA si nécessaire pour les lecteurs d'écran.

3. **Responsive :** Vérifier que la page pricing s'affiche correctement sur mobile (grid md:grid-cols-3).

4. **SEO :** Si nécessaire, ajouter des meta tags pour la page pricing.

5. **Internationalisation :** Si l'app supporte plusieurs langues, adapter les textes avec le système de traduction existant.

---

## 🚀 Résultat attendu

Après avoir suivi toutes les étapes, vous devriez avoir :

1. ✅ Un bouton "Passer à l'abonnement premium" dans la page de connexion
2. ✅ Un bouton "Passer à l'abonnement premium" dans les paramètres (section MON PROFIL)
3. ✅ Une page pricing avec :
   - Animations de texte (VerticalCutReveal)
   - Particules animées (Sparkles)
   - Timeline animations pour les éléments
   - Toggle Monthly/Yearly
   - 3 cartes de plans (Starter, Business, Enterprise)
   - Effets de fond animés (ellipses bleues floutées)
   - Design moderne et professionnel

Les deux boutons redirigent vers la page pricing (`setActiveTab('pricing')`).

---

**Date de création :** 2025-01-XX
**Auteur :** Plan d'implémentation généré pour Momentum
**Version :** 1.0

