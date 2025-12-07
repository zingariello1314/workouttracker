// ================ BLOC RYTHME DE LECTURE - PRIORITÉ MODÉRÉE ================

window.ReadingRhythmBlock = {
  template: `
    <div class="max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl border border-cyan-500/20" style="box-shadow: 0 0 50px rgba(6, 182, 212, 0.1), 0 0 100px rgba(6, 182, 212, 0.05)">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-3 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full animate-pulse"></div>
          <h1 class="text-xl font-bold text-cyan-400 tracking-wide" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.6), 0 0 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)">RYTHME LECTURE</h1>
        </div>
        <div class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r" :class="streakStatus.color" style="box-shadow: 0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)">
          {{ streakStatus.label }}
        </div>
      </div>

      <!-- Streak Circle -->
      <div class="flex flex-col items-center mb-6">
        <div class="relative w-52 h-52 mb-8">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120" style="filter: none">
            <defs>
              <!-- Gradients complexes -->
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0891b2" stop-opacity="1" />
                <stop offset="25%" stop-color="#0ea5e9" stop-opacity="1" />
                <stop offset="50%" stop-color="#059669" stop-opacity="1" />
                <stop offset="75%" stop-color="#0d9488" stop-opacity="1" />
                <stop offset="100%" stop-color="#2563eb" stop-opacity="1" />
              </linearGradient>
              
              <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.6" />
                <stop offset="50%" stop-color="#10b981" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.6" />
              </linearGradient>
              
              <radialGradient id="centerRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#0891b2" stop-opacity="0.1" />
                <stop offset="60%" stop-color="#059669" stop-opacity="0.05" />
                <stop offset="100%" stop-color="transparent" />
              </radialGradient>
              
              <!-- Filtres pour effets -->
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <!-- Fond radial subtil -->
            <circle cx="60" cy="60" r="52" fill="url(#centerRadial)" />
            
            <!-- Cercles de structure multiple -->
            <circle cx="60" cy="60" r="50" stroke="#1e293b" stroke-width="1" fill="none" opacity="0.2" />
            <circle cx="60" cy="60" r="47" stroke="#334155" stroke-width="0.5" fill="none" opacity="0.3" />
            <circle cx="60" cy="60" r="44" stroke="#475569" stroke-width="2" fill="none" opacity="0.4" />
            
            <!-- Cercles internes décoratifs -->
            <circle cx="60" cy="60" r="35" stroke="#64748b" stroke-width="1" fill="none" opacity="0.3" />
            <circle cx="60" cy="60" r="30" stroke="#64748b" stroke-width="0.5" fill="none" opacity="0.2" />
            <circle cx="60" cy="60" r="25" stroke="#64748b" stroke-width="0.5" fill="none" opacity="0.15" />
            
            <!-- Cercles de paliers avec patterns -->
              <template v-if="currentTier >= 1">
                <circle
              cx="60"
              cy="60"
              r="32"
              stroke="#059669"
              stroke-width="3"
              fill="none"
              stroke-dasharray="201.1 201.1"
              stroke-linecap="round"
              opacity="0.5"
              filter="url(#innerGlow)"
            />
                <circle
              cx="60"
              cy="60"
              r="28"
              stroke="#10b981"
              stroke-width="1.5"
              fill="none"
              stroke-dasharray="4 2"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 60 60"
                to="360 60 60"
                dur="20s"
                repeatCount="indefinite"/>
            </circle>
              </template>
            
              <template v-if="currentTier >= 2">
                <circle
              cx="60"
              cy="60"
              r="38"
              stroke="#7c3aed"
              stroke-width="3"
              fill="none"
              stroke-dasharray="238.8 238.8"
              stroke-linecap="round"
              opacity="0.5"
              filter="url(#innerGlow)"
            />
                <circle
              cx="60"
              cy="60"
              r="36"
              stroke="#8b5cf6"
              stroke-width="1"
              fill="none"
              stroke-dasharray="3 3"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 60 60"
                to="0 60 60"
                dur="25s"
                    repeatCount="indefinite"
                  />
            </circle>
              </template>
            
            <!-- Cercle de progression principal avec multiple couches -->
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="url(#progressGradient)"
              stroke-width="10"
              fill="none"
                :stroke-dasharray="tierProgress * 282.7 + ' 282.7'"
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out"
              filter="url(#glow)"
              opacity="0.9"
            />
            
            <!-- Cercle interne de progression -->
            <circle
              cx="60"
              cy="60"
              r="42"
              stroke="url(#innerGradient)"
              stroke-width="4"
              fill="none"
                :stroke-dasharray="tierProgress * 263.9 + ' 263.9'"
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out"
              opacity="0.6"
            />
            
            <!-- Éléments décoratifs géométriques -->
            <g opacity="0.4">
              <!-- Segments décoratifs -->
              <g>
                <line x1="60" y1="15" x2="60" y2="20" stroke="#0891b2" stroke-width="2" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite"/>
                </line>
                <line x1="60" y1="100" x2="60" y2="105" stroke="#059669" stroke-width="2" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite"/>
                </line>
                <line x1="15" y1="60" x2="20" y2="60" stroke="#2563eb" stroke-width="2" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
                </line>
                <line x1="100" y1="60" x2="105" y2="60" stroke="#0d9488" stroke-width="2" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
                </line>
              </g>
              
              <!-- Segments diagonaux -->
              <g>
                <line x1="81.21" y1="21.21" x2="84.85" y2="17.57" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="5s" repeatCount="indefinite"/>
                </line>
                <line x1="38.79" y1="98.79" x2="35.15" y2="102.43" stroke="#10b981" stroke-width="1.5" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="5s" repeatCount="indefinite"/>
                </line>
                <line x1="21.21" y1="38.79" x2="17.57" y2="35.15" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="4.5s" repeatCount="indefinite"/>
                </line>
                <line x1="98.79" y1="81.21" x2="102.43" y2="84.85" stroke="#0891b2" stroke-width="1.5" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="4.5s" repeatCount="indefinite"/>
                </line>
              </g>
            </g>
            
            <!-- Cercle externe complexe -->
            <circle
              cx="60"
              cy="60"
              r="53"
              stroke="#0891b2"
              stroke-width="0.5"
              fill="none"
              stroke-dasharray="1 2 4 2"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 60 60"
                to="360 60 60"
                dur="45s"
                repeatCount="indefinite"/>
            </circle>
            
            <circle
              cx="60"
              cy="60"
              r="55"
              stroke="#059669"
              stroke-width="0.3"
              fill="none"
              stroke-dasharray="2 8"
              opacity="0.2"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 60 60"
                to="0 60 60"
                dur="60s"
                repeatCount="indefinite"/>
            </circle>
          </svg>
          
          <!-- Centre -->
          <div class="absolute inset-0 flex flex-col items-center justify-center" style="transform: translateY(-4px)">
            <div class="text-center">
              <div class="text-5xl font-extrabold bg-gradient-to-b from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent mb-0" 
                   style="font-family: 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; text-shadow: 0 0 40px rgba(6, 182, 212, 0.6); line-height: 1; letter-spacing: -0.02em">
                {{ readingData.streak }}
              </div>
              <div class="text-xs font-semibold bg-gradient-to-b from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent mt-1" 
                   style="font-family: 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; text-shadow: 0 0 20px rgba(6, 182, 212, 0.4); letter-spacing: 0.15em">
                JOURS
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-center max-w-sm">
          <p class="text-cyan-300 font-bold text-xl mb-3">
            Rythme {{ streakStatus.label.toLowerCase() }} depuis {{ readingData.streak }} jours !
          </p>
          <p class="text-slate-400 text-sm bg-slate-800/80 px-4 py-2 rounded-full border border-slate-600/50">
            Palier {{ currentTier + 1 }} • {{ progressInTier }}/7 dans ce niveau
          </p>
        </div>
      </div>

      <!-- Stats Grid -->
      <!-- Stats Cards - 6 cartes avec les données manquantes -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Aujourd'hui</div>
          <div class="text-lg font-bold">{{ readingData.todayMinutes }}</div>
          <div class="text-xs text-slate-400">min</div>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Semaine</div>
          <div class="text-lg font-bold">{{ weeklyMinutes }}</div>
          <div class="text-xs text-slate-400">min</div>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Session moy.</div>
          <div class="text-lg font-bold">{{ avgSession }}</div>
          <div class="text-xs text-slate-400">min</div>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Semaine min</div>
          <div class="text-lg font-bold">{{ weeklyMinSession }}</div>
          <div class="text-xs text-slate-400">min</div>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Session moy min</div>
          <div class="text-lg font-bold">{{ avgSessionMin }}</div>
          <div class="text-xs text-slate-400">min</div>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-3 border border-cyan-500/20">
          <div class="text-cyan-400 text-xs mb-1">Vitesse</div>
          <div class="text-lg font-bold">{{ readingData.readingSpeed }}</div>
          <div class="text-xs text-slate-400">p/h</div>
        </div>
      </div>

      <!-- Daily Goal -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 text-cyan-400">🎯</div>
          <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">OBJECTIF QUOTIDIEN</h3>
        </div>
          <span class="text-lg font-bold">{{ readingData.dailyGoal }} min</span>
        </div>
        
        <div class="w-full bg-slate-700 rounded-full h-3 mb-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
            :style="{ 
              width: Math.min(progressPercentage, 100) + '%',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(16, 185, 129, 0.4)'
            }"
          ></div>
        </div>
        
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-300">{{ readingData.todayMinutes }} / {{ readingData.dailyGoal }} min</span>
          <span class="font-bold" :class="progressPercentage >= 100 ? 'text-emerald-400' : 'text-cyan-400'">
            ({{ Math.round(progressPercentage) }}%)
          </span>
        </div>
      </div>

      <!-- Prédictions et Optimisation -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 text-cyan-400">📊</div>
          <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">PRÉDICTIONS & OPTIMISATION</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Prédiction principale -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="text-cyan-300 text-sm font-medium">Projection actuelle</div>
              <div class="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">Rythme optimal</div>
            </div>
            
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center">
                <div class="text-xs text-cyan-400 mb-1">Pages restantes</div>
                <div class="text-2xl font-bold text-white">{{ readingData.pagesRemaining }}</div>
                <div class="text-xs text-slate-400">67% du livre</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-cyan-400 mb-1">Temps estimé</div>
                <div class="text-2xl font-bold text-white">{{ Math.round(estimatedTimeLeft/60) }}h {{ Math.round(estimatedTimeLeft%60) }}m</div>
                <div class="text-xs text-emerald-400">-23min vs prévu initial</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-cyan-400 mb-1">Fin prévue</div>
                <div class="text-2xl font-bold text-white">{{ estimatedDays }}j</div>
                <div class="text-xs text-slate-400">Dimanche 21h30</div>
              </div>
            </div>

            <!-- Barre de progression du livre -->
            <div class="w-full bg-slate-700 rounded-full h-3 mb-3">
              <div 
                class="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
                style="width: 33%; box-shadow: 0 0 10px rgba(6, 182, 212, 0.5)"
              ></div>
            </div>
            <div class="text-xs text-slate-400 text-center">
              Basé sur {{ readingData.avgSession }} min/jour (moyenne actuelle) et {{ readingData.readingSpeed }} pages/h
            </div>
          </div>

          <!-- Scénarios multiples -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div class="text-cyan-300 text-sm font-medium mb-3">Scénarios d'optimisation</div>
            
            <div class="space-y-3">
              <!-- Scénario conservateur -->
              <div class="bg-slate-700/40 rounded-lg p-3 border border-slate-500/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-slate-500/40 rounded-full"></div>
                    <span class="text-slate-300 text-sm">Rythme minimum (30 min/jour)</span>
                  </div>
                  <span class="text-slate-400 text-xs">9 jours</span>
                </div>
                <div class="text-xs text-slate-400">Fin prévue: 28 septembre • Sécurité maximale</div>
              </div>

              <!-- Scénario actuel -->
              <div class="bg-cyan-900/30 rounded-lg p-3 border border-cyan-400/40">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span class="text-cyan-300 text-sm font-medium">Rythme actuel ({{ readingData.avgSession }} min/jour)</span>
                  </div>
                  <span class="text-cyan-400 text-xs font-bold">{{ estimatedDays }} jours</span>
                </div>
                <div class="text-xs text-cyan-300">Fin prévue: 24 septembre • Équilibre optimal</div>
              </div>

              <!-- Scénario intensif -->
              <div class="bg-emerald-900/30 rounded-lg p-3 border border-emerald-400/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-emerald-400 rounded-full"></div>
                    <span class="text-emerald-300 text-sm">Rythme intensif (90 min/jour)</span>
                  </div>
                  <span class="text-emerald-400 text-xs">3 jours</span>
                </div>
                <div class="text-xs text-emerald-300">Fin prévue: 22 septembre • Challenge motivant</div>
              </div>
            </div>
          </div>

          <!-- Facteurs d'accélération -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
            <div class="text-cyan-300 text-sm font-medium mb-3">Leviers d'optimisation</div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-orange-900/20 rounded-lg p-3 border border-orange-400/20">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-orange-400 text-xs">🚀</span>
                  <span class="text-orange-300 text-sm font-medium">Vitesse ++</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  Lectures en créneau 19h-21h
                </div>
                <div class="text-orange-400 text-xs font-bold">-1.5 jours</div>
              </div>

              <div class="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-purple-400 text-xs">⏰</span>
                  <span class="text-purple-300 text-sm font-medium">Sessions ++</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  +15min par session
                </div>
                <div class="text-purple-400 text-xs font-bold">-1 jour</div>
              </div>

              <div class="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-blue-400 text-xs">🌧️</span>
                  <span class="text-blue-300 text-sm font-medium">Météo boost</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  3 jours de pluie prévus
                </div>
                <div class="text-blue-400 text-xs font-bold">-0.5 jour</div>
              </div>

              <div class="bg-green-900/20 rounded-lg p-3 border border-green-400/20">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-green-400 text-xs">📅</span>
                  <span class="text-green-300 text-sm font-medium">Weekend boost</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  Sessions weekend 2x plus longues
                </div>
                <div class="text-green-400 text-xs font-bold">-0.8 jour</div>
              </div>
            </div>
          </div>

          <!-- Recommandations IA -->
          <div class="bg-cyan-900/30 rounded-xl p-4 border border-cyan-400/30">
            <div class="text-cyan-300 text-sm font-medium mb-3">Plan optimisé par IA</div>
            
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-cyan-400 text-xs">🎯</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm font-medium">Objectif optimisé: Finir vendredi soir</div>
                  <div class="text-xs text-slate-400">Combinez votre créneau 19h-21h + weekend boost</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-cyan-400 text-xs">⚡</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm">Sessions suggérées: 65min (mar/jeu), 90min (weekend)</div>
                  <div class="text-xs text-slate-400">Probabilité de réussite: 89%</div>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-cyan-400 text-xs">📈</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm">Gain total estimé: -2.3 jours vs rythme actuel</div>
                  <div class="text-xs text-emerald-400">Finition 48h plus tôt que prévu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Session Timer -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-4 border border-cyan-500/20">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button 
              @click="toggleReading"
              class="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              :class="isReading ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'"
              :style="isReading ? 'box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)' : 'box-shadow: 0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)'"
            >
              <span v-if="isReading">⏸️</span>
              <span v-else>▶️</span>
            </button>
            <div>
              <div class="text-cyan-400 text-sm">{{ isReading ? 'Session en cours' : 'Session en pause' }}</div>
              <div class="text-2xl font-bold font-mono">{{ formatTime(sessionTime) }}</div>
            </div>
          </div>
          <div v-if="readingData.todayMinutes >= readingData.dailyGoal" class="bg-emerald-500/20 border border-emerald-400 rounded-lg px-3 py-2" style="box-shadow: 0 0 15px rgba(16, 185, 129, 0.3), 0 0 25px rgba(16, 185, 129, 0.2)">
            <div class="text-emerald-400 text-xs font-bold" style="text-shadow: 0 0 8px rgba(16, 185, 129, 0.6)">✓ OBJECTIF ATTEINT</div>
            <div class="text-emerald-300 text-xs italic">Petits pas, grandes distances.</div>
          </div>
        </div>
      </div>

      <!-- Milestone -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 text-yellow-400">🏆</div>
            <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">PROCHAIN JALON</h3>
          </div>
          <span class="text-sm text-slate-300">{{ nextMilestone.days }} jours</span>
        </div>
        
        <div class="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div 
            class="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-1000"
            :style="{ 
              width: (nextMilestone.progress / nextMilestone.total) * 100 + '%',
              boxShadow: '0 0 12px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 146, 60, 0.4)'
            }"
          ></div>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-300">
            {{ nextMilestone.progress }} / {{ nextMilestone.total }} jours
          </span>
          <span class="text-xs text-yellow-400 font-medium">
            🏆 {{ nextMilestone.name }}
          </span>
        </div>
        <div class="text-xs text-slate-400 text-center mt-2">
          Palier {{ nextMilestone.tier }} • Série de 7 jours consécutifs
        </div>
      </div>

      <!-- Countdown to Midnight -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-cyan-400 text-lg">🕐</span>
            <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">TEMPS RESTANT AUJOURD'HUI</h3>
          </div>
        </div>
        
        <div class="flex items-center justify-center gap-2 font-mono text-white mb-3">
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.hours.toString().padStart(2, '0') }}h
          </span>
          <span class="text-cyan-400 text-2xl">:</span>
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.minutes.toString().padStart(2, '0') }}m
          </span>
          <span class="text-cyan-400 text-2xl">:</span>
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.seconds.toString().padStart(2, '0') }}s
          </span>
        </div>
        
        <div class="w-full bg-slate-700 rounded-full h-3 mb-2">
          <div 
            class="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
            :style="{ 
              width: dayProgressPercentage + '%',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(59, 130, 246, 0.4)'
            }"
          ></div>
        </div>
        
        <div class="text-xs text-slate-400 text-center">
          Progression de la journée • {{ Math.round(dayProgressPercentage) }}% accomplie
        </div>
      </div>

      <!-- Motivateurs Dynamiques -->
      <div class="bg-gradient-to-r from-purple-800/40 to-pink-800/40 rounded-2xl p-4 mb-6 border border-purple-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <h3 class="text-purple-400 font-bold" style="text-shadow: 0 0 8px rgba(168, 85, 247, 0.5)">⚡ SYSTÈME DE MOTIVATION</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Score de motivation global -->
          <div class="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 border border-purple-400/30">
            <div class="flex items-center justify-between mb-3">
              <div class="text-purple-300 text-sm font-medium">Score motivation global</div>
              <div class="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">Temps réel</div>
            </div>
            
            <div class="flex items-center gap-4 mb-3">
              <div class="relative w-16 h-16">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-md"></div>
                <svg class="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#4c1d95" stroke-width="3" fill="none" opacity="0.3"/>
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    stroke="url(#motivationGradient)" 
                    stroke-width="3" 
                    fill="none"
                    stroke-dasharray="78 100"
                    stroke-linecap="round"
                  />
                  <defs>
                    <linearGradient id="motivationGradient">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center z-20">
                  <span class="text-xl font-bold text-purple-300">78</span>
                </div>
              </div>
              
              <div class="flex-1">
                <div class="text-white font-bold text-lg">Motivation excellente</div>
                <div class="text-xs text-purple-300">Pic atteint il y a 2h</div>
                <div class="flex items-center gap-2 mt-1">
                  <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span class="text-xs text-emerald-400">+12 points depuis hier</span>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-4 gap-2 text-xs">
              <div class="text-center">
                <div class="text-purple-400 font-bold">89%</div>
                <div class="text-slate-400">Élan</div>
              </div>
              <div class="text-center">
                <div class="text-pink-400 font-bold">72%</div>
                <div class="text-slate-400">Plaisir</div>
              </div>
              <div class="text-center">
                <div class="text-blue-400 font-bold">81%</div>
                <div class="text-slate-400">Confiance</div>
              </div>
              <div class="text-center">
                <div class="text-cyan-400 font-bold">76%</div>
                <div class="text-slate-400">Curiosité</div>
              </div>
            </div>
          </div>

          <!-- Motivateurs actifs -->
          <div class="space-y-3">
            <div class="text-purple-300 text-sm font-medium">Leviers motivationnels actifs</div>
            
            <div class="space-y-3">
              <!-- Momentum -->
              <div class="bg-slate-800/60 rounded-xl p-3 border border-purple-500/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span class="text-purple-400 text-xs">🚀</span>
                    </div>
                    <span class="text-purple-300 text-sm font-medium">Élan du moment</span>
                  </div>
                  <span class="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">FORT</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div 
                    class="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-1000"
                    style="width: 89%; box-shadow: 0 0 10px rgba(168, 85, 247, 0.5)"
                  ></div>
                </div>
                <div class="text-xs text-slate-400">Momentum basé sur vos 3 dernières sessions exceptionnelles</div>
              </div>

              <!-- Comparaison temporelle -->
              <div class="reading-rhythm__motivator-item">
                <div class="reading-rhythm__motivator-header">
                  <div class="reading-rhythm__motivator-info">
                    <div class="reading-rhythm__motivator-icon">📈</div>
                    <span class="reading-rhythm__motivator-label">Progression temporelle</span>
                  </div>
                  <span class="reading-rhythm__motivator-trend">+23% ↗</span>
                </div>
                <div class="reading-rhythm__motivator-description">Cette semaine vs même semaine l'an dernier</div>
                <div class="reading-rhythm__motivator-comparison">
                  <div class="reading-rhythm__motivator-comparison-item">
                    <span class="reading-rhythm__motivator-comparison-label">2023:</span>
                    <span class="reading-rhythm__motivator-comparison-value">327 min</span>
                  </div>
                  <div class="reading-rhythm__motivator-comparison-item">
                    <span class="reading-rhythm__motivator-comparison-label">2024:</span>
                    <span class="reading-rhythm__motivator-comparison-value current">415 min</span>
                  </div>
                </div>
              </div>

              <!-- Effet domino -->
              <div class="reading-rhythm__motivator-item">
                <div class="reading-rhythm__motivator-header">
                  <div class="reading-rhythm__motivator-info">
                    <div class="reading-rhythm__motivator-icon">⚡</div>
                    <span class="reading-rhythm__motivator-label">Effet cascade</span>
                  </div>
                  <span class="reading-rhythm__motivator-impact">+18%</span>
                </div>
                <div class="reading-rhythm__motivator-description">Cette session influence positivement demain</div>
                <div class="reading-rhythm__motivator-detail">
                  Historique : après 60+ min, vous dépassez l'objectif le lendemain dans 82% des cas
                </div>
              </div>
            </div>
          </div>

          <!-- Prédictions motivationnelles -->
          <div class="reading-rhythm__motivation-predictions">
            <div class="reading-rhythm__motivation-predictions-title">Prédictions motivationnelles</div>
            
            <div class="reading-rhythm__motivation-predictions-list">
              <div class="reading-rhythm__motivation-prediction-item">
                <div class="reading-rhythm__motivation-prediction-icon">🔮</div>
                <div class="reading-rhythm__motivation-prediction-content">
                  <div class="reading-rhythm__motivation-prediction-text">Pic de motivation prévu demain 20h</div>
                  <div class="reading-rhythm__motivation-prediction-subtext">Basé sur votre cycle circadien et pattern social</div>
                </div>
              </div>
              
              <div class="reading-rhythm__motivation-prediction-item">
                <div class="reading-rhythm__motivation-prediction-icon">⚠️</div>
                <div class="reading-rhythm__motivation-prediction-content">
                  <div class="reading-rhythm__motivation-prediction-text">Attention : baisse prévue jeudi</div>
                  <div class="reading-rhythm__motivation-prediction-subtext">Préparez des sessions courtes et récompenses</div>
                </div>
              </div>

              <div class="reading-rhythm__motivation-prediction-item">
                <div class="reading-rhythm__motivation-prediction-icon">🎯</div>
                <div class="reading-rhythm__motivation-prediction-content">
                  <div class="reading-rhythm__motivation-prediction-text">Weekend boost incoming (+34%)</div>
                  <div class="reading-rhythm__motivation-prediction-subtext">Idéal pour rattraper ou prendre de l'avance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Intelligence de Lecture -->
      <div class="bg-gradient-to-r from-teal-800/40 to-cyan-800/40 rounded-2xl p-4 mb-6 border border-teal-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 class="text-teal-400 font-bold" style="text-shadow: 0 0 8px rgba(20, 184, 166, 0.5)">🧠 INTELLIGENCE DE LECTURE</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Heatmap des créneaux optimaux -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-teal-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="text-teal-300 text-sm font-medium">Créneaux de performance</div>
              <div class="text-xs text-teal-400 bg-teal-500/20 px-2 py-1 rounded">Analyse 30 jours</div>
            </div>
            
            <!-- Heatmap horaire -->
            <div class="grid grid-cols-8 gap-1 mb-3">
              <div class="text-center" v-for="slot in heatmapSlots" :key="slot.hour">
                <div 
                  class="h-8 rounded-md transition-all duration-300 flex items-center justify-center text-xs font-bold"
                  :class="{
                    'bg-teal-400 text-slate-900': slot.intensity >= 90,
                    'bg-teal-500/80 text-white': slot.intensity >= 70 && slot.intensity < 90,
                    'bg-teal-600/60 text-teal-100': slot.intensity >= 50 && slot.intensity < 70,
                    'bg-teal-700/40 text-teal-200': slot.intensity >= 30 && slot.intensity < 50,
                    'bg-slate-700/60 text-slate-400': slot.intensity < 30
                  }"
                  :style="slot.intensity >= 90 ? {boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)'} : {}"
                >
                  {{ slot.intensity >= 90 ? '🔥' : slot.intensity >= 70 ? '⚡' : '' }}
                </div>
                <div class="text-xs text-slate-400 mt-1">{{ slot.hour }}</div>
              </div>
            </div>
            
            <div class="bg-teal-900/30 rounded-lg p-3 border border-teal-400/20">
              <div class="text-teal-300 text-sm font-medium mb-1">Zone optimale détectée</div>
              <div class="text-white font-bold mb-2">19h-21h • Performance +34%</div>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-teal-400">Vitesse:</span> <span class="text-white">35 pages/h</span>
                </div>
                <div>
                  <span class="text-teal-400">Focus:</span> <span class="text-white">92% maintenu</span>
                </div>
                <div>
                  <span class="text-teal-400">Rétention:</span> <span class="text-white">+18%</span>
                </div>
                <div>
                  <span class="text-teal-400">Plaisir:</span> <span class="text-white">Score 8.4/10</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Facteurs d'influence -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-teal-500/20">
            <div class="text-teal-300 text-sm font-medium mb-4">Facteurs d'influence détectés</div>
            
            <div class="space-y-3">
              <!-- Météo -->
              <div class="bg-slate-700/40 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span class="text-blue-400 text-xs">☔</span>
                    </div>
                    <span class="text-slate-300 text-sm">Conditions météo</span>
                  </div>
                  <span class="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Impact fort</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div class="text-slate-400">Pluie</div>
                    <div class="text-blue-400 font-bold">+15min</div>
                  </div>
                  <div>
                    <div class="text-slate-400">Soleil</div>
                    <div class="text-orange-400 font-bold">-8min</div>
                  </div>
                  <div>
                    <div class="text-slate-400">Nuageux</div>
                    <div class="text-slate-300 font-bold">Normal</div>
                  </div>
                </div>
              </div>

              <!-- Jour de la semaine -->
              <div class="bg-slate-700/40 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span class="text-purple-400 text-xs">📅</span>
                    </div>
                    <span class="text-slate-300 text-sm">Cycle hebdomadaire</span>
                  </div>
                  <span class="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">Pattern stable</span>
                </div>
                <div class="flex justify-between text-xs">
                  <div class="text-center" v-for="(score, index) in weeklyScores" :key="index">
                    <div class="text-xs font-bold" :class="score >= 90 ? 'text-emerald-400' : score >= 80 ? 'text-cyan-400' : score >= 70 ? 'text-yellow-400' : 'text-slate-400'">
                      {{ score }}%
                    </div>
                    <div class="text-slate-500">{{ ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][index] }}</div>
                  </div>
                </div>
              </div>

              <!-- État émotionnel -->
              <div class="bg-slate-700/40 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <span class="text-pink-400 text-xs">💭</span>
                    </div>
                    <span class="text-slate-300 text-sm">État d'esprit optimal</span>
                  </div>
                  <span class="text-xs text-pink-400 bg-pink-500/20 px-2 py-1 rounded">IA prédictive</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  Vous lisez 28% mieux quand vous êtes détendu après une journée productive
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span class="text-xs text-pink-300">État actuel détecté: Réceptif</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recommandations personnalisées -->
          <div class="bg-teal-900/30 rounded-xl p-4 border border-teal-400/30">
            <div class="text-teal-300 text-sm font-medium mb-3">Recommandations IA</div>
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-teal-400 text-xs">🎯</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm">Session optimale dans 47 minutes (19h15)</div>
                  <div class="text-xs text-slate-400">Pic de concentration prévu + météo favorable</div>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-teal-400 text-xs">📖</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm">Genre suggéré: Science-fiction</div>
                  <div class="text-xs text-slate-400">+23% d'engagement les dimanches soir</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Overview -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 text-cyan-400">📅</div>
          <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">ANALYSE 7 DERNIERS JOURS</h3>
        </div>
        
        <!-- Vue d'ensemble hebdomadaire -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div class="text-xs text-cyan-400 mb-1">Total semaine</div>
            <div class="text-lg font-bold text-white">{{ weeklyMinutes }} min</div>
            <div class="text-xs text-emerald-400">+12% vs semaine passée</div>
          </div>
          <div class="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div class="text-xs text-cyan-400 mb-1">Meilleur jour</div>
            <div class="text-lg font-bold text-white">Jeudi</div>
            <div class="text-xs text-slate-400">71 minutes</div>
          </div>
          <div class="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/10">
            <div class="text-xs text-cyan-400 mb-1">Régularité</div>
            <div class="text-lg font-bold text-white">100%</div>
            <div class="text-xs text-emerald-400">7/7 jours réussis</div>
          </div>
        </div>

        <!-- Timeline détaillée des jours -->
        <div class="space-y-3">
          <div class="bg-slate-800/40 rounded-xl p-3 border transition-all duration-300 hover:bg-slate-700/40" v-for="(day, index) in readingData.weeklyData" :key="index" :class="index === readingData.weeklyData.length - 1 ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-slate-600/30'">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all" :class="index === readingData.weeklyData.length - 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : day.completed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-700 text-slate-400'">
                  {{ day.day }}
                </div>
                <div>
                  <div class="text-sm font-medium text-white">
                    {{ ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][index] }}
                    <span v-if="index === readingData.weeklyData.length - 1" class="text-xs text-cyan-400 ml-2">Aujourd'hui</span>
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ day.minutes }} minutes • {{ Math.round((day.minutes / 60) * readingData.readingSpeed * 10) / 10 }} pages lues
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-medium mb-1" :class="getPerformanceLevel(day.minutes) === 'excellent' ? 'text-emerald-400' : getPerformanceLevel(day.minutes) === 'bon' ? 'text-cyan-400' : 'text-slate-400'">
                  {{ getPerformanceLevel(day.minutes).toUpperCase() }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ day.minutes >= readingData.dailyGoal ? '+' + (day.minutes - readingData.dailyGoal) + 'min' : '-' + (readingData.dailyGoal - day.minutes) + 'min' }}
                </div>
              </div>
            </div>
            
            <!-- Barre de progression -->
            <div class="w-full bg-slate-700 rounded-full h-1.5 mb-2">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="index === readingData.weeklyData.length - 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : getPerformanceLevel(day.minutes) === 'excellent' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : getPerformanceLevel(day.minutes) === 'bon' ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'"
                :style="{ 
                  width: Math.min((day.minutes / 80) * 100, 100) + '%',
                  boxShadow: index === readingData.weeklyData.length - 1 ? '0 0 8px rgba(6, 182, 212, 0.4)' : ''
                }"
              ></div>
            </div>

            <!-- Détails supplémentaires -->
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="text-slate-400">
                <span class="text-slate-500">Sessions:</span> {{ Math.ceil(day.minutes / 25) }}
              </div>
              <div class="text-slate-400">
                <span class="text-slate-500">Objectif:</span> {{ day.minutes >= readingData.dailyGoal ? '✓' : '×' }}
              </div>
              <div class="text-slate-400">
                <span class="text-slate-500">Score:</span> {{ Math.round(day.minutes / readingData.dailyGoal * 100) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Insights de la semaine -->
        <div class="mt-5 space-y-3">
          <div class="text-cyan-400 text-sm font-medium">Insights de votre semaine</div>
          
          <div class="grid grid-cols-1 gap-3">
            <div class="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-emerald-400 text-xs">🔥</span>
                </div>
                <div>
                  <div class="text-emerald-300 text-sm font-medium">Série parfaite</div>
                  <div class="text-xs text-slate-300">
                    7 jours consécutifs au-dessus de l'objectif. Votre meilleure série depuis février !
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-cyan-400 text-xs">📈</span>
                </div>
                <div>
                  <div class="text-cyan-300 text-sm font-medium">Progression constante</div>
                  <div class="text-xs text-slate-300">
                    Tendance croissante détectée : +8min en moyenne par rapport à la semaine passée
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-purple-400 text-xs">⚡</span>
                </div>
                <div>
                  <div class="text-purple-300 text-sm font-medium">Pattern optimal</div>
                  <div class="text-xs text-slate-300">
                    Jeudi et vendredi sont vos jours les plus productifs (moyenne: 63min)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Countdown to Midnight -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 text-cyan-400">🕐</div>
            <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">TEMPS RESTANT AUJOURD'HUI</h3>
          </div>
        </div>
        
        <div class="flex items-center justify-center gap-2 font-mono text-white mb-3">
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.hours.toString().padStart(2, '0') }}h
          </span>
          <span class="text-cyan-400 text-2xl">:</span>
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.minutes.toString().padStart(2, '0') }}m
          </span>
          <span class="text-cyan-400 text-2xl">:</span>
          <span class="bg-cyan-500/20 border border-cyan-400/40 px-4 py-3 rounded-xl text-xl font-bold" style="box-shadow: 0 0 15px rgba(6, 182, 212, 0.4)">
            {{ timeUntilMidnight.seconds.toString().padStart(2, '0') }}s
          </span>
        </div>
        
        <div class="w-full bg-slate-700 rounded-full h-3 mb-2">
          <div 
            class="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
            :style="{ 
              width: dayProgressPercentage + '%',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(59, 130, 246, 0.4)'
            }"
          ></div>
        </div>
        
        <div class="text-xs text-slate-400 text-center">
          Progression de la journée • {{ Math.round(dayProgressPercentage) }}% accomplie
        </div>
      </div>

      <!-- Flux Énergétique de Lecture -->
      <div class="bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-2xl p-4 mb-6 border border-indigo-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 class="text-indigo-400 font-bold" style="text-shadow: 0 0 8px rgba(99, 102, 241, 0.5)">🌊 FLUX ÉNERGÉTIQUE DE LECTURE</h3>
        </div>
        
        <div class="space-y-6">
          <!-- Graphique sinusoïdal des vagues de motivation -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
            <div class="flex items-center justify-between mb-2">
              <div class="text-indigo-300 text-sm font-medium">Courbe de motivation</div>
              <div class="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">30 derniers jours</div>
            </div>
            <div class="text-xs text-slate-400 mb-4">
              Votre envie de lire suit des cycles naturels prévisibles
            </div>
            
            <div class="relative h-24 bg-slate-900/50 rounded-lg overflow-hidden mb-3">
              <svg class="w-full h-full" viewBox="0 0 200 70" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.6" />
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1" />
                  </linearGradient>
                </defs>
                
                <!-- Ligne de référence moyenne -->
                <line x1="0" y1="40" x2="200" y2="40" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
                
                <!-- Vague principale -->
                <path
                  d="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35"
                  stroke="#6366f1"
                  stroke-width="3"
                  fill="none"
                  style="filter: drop-shadow(0 0 4px #6366f1);"
                >
                  <animate
                    attributeName="d"
                    values="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35;M0 35 Q25 40 50 30 T100 45 T150 25 T200 40;M0 45 Q25 25 50 35 T100 30 T150 40 T200 35"
                    dur="8s"
                    repeatCount="indefinite"/>
                </path>
                
                <!-- Zone remplie sous la vague -->
                <path
                  d="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z"
                  fill="url(#waveGradient)"
                >
                  <animate
                    attributeName="d"
                    values="M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z;M0 35 Q25 40 50 30 T100 45 T150 25 T200 40 L200 70 L0 70 Z;M0 45 Q25 25 50 35 T100 30 T150 40 T200 35 L200 70 L0 70 Z"
                    dur="8s"
                    repeatCount="indefinite"/>
                </path>
                
                <!-- Point actuel -->
                <circle cx="170" cy="37" r="4" fill="#6366f1">
                  <animate attributeName="cy" values="37;30;37" dur="8s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Labels temporels -->
                <text x="10" y="65" font-size="9" fill="#64748b">Il y a 30j</text>
                <text x="85" y="65" font-size="9" fill="#64748b">Il y a 15j</text>
                <text x="150" y="65" font-size="9" fill="#6366f1" font-weight="bold">Aujourd'hui</text>
              </svg>
              
              <div class="absolute top-2 right-3 flex items-center gap-2">
                <div class="text-xs text-indigo-300 font-semibold bg-indigo-900/40 px-2 py-1 rounded">
                  Motivation: 78%
                </div>
              </div>
            </div>
            
            <div class="text-xs text-slate-500 text-center">
              Votre niveau actuel est au-dessus de votre moyenne habituelle
            </div>
          </div>

          <!-- Explication des phases -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
            <div class="text-indigo-300 text-sm font-medium mb-3">Vos phases de lecture</div>
            <div class="text-xs text-slate-400 mb-4">
              Basé sur votre historique, vous alternez entre des périodes d'engagement fort et de repos naturel
            </div>
            
            <div class="space-y-4">
              <!-- Phase actuelle -->
              <div class="bg-indigo-900/30 rounded-lg p-3 border border-indigo-400/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span class="text-indigo-300 text-sm font-medium">Phase productive (actuelle)</span>
                  </div>
                  <span class="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">Depuis 14 jours</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  Période où vous avez naturellement plus d'élan pour lire. Vous terminez vos sessions plus facilement et lisez plus longtemps.
                </div>
                <div class="text-xs text-indigo-200">
                  ✓ Profitez-en pour tackle des livres plus challenging
                </div>
              </div>

              <!-- Phase suivante -->
              <div class="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-purple-400 rounded-full opacity-60"></div>
                    <span class="text-purple-300 text-sm font-medium">Phase tranquille (prochaine)</span>
                  </div>
                  <span class="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Dans ~7 jours</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  Période de récupération naturelle où l'envie de lire diminue temporairement. C'est normal et prévisible.
                </div>
                <div class="text-xs text-purple-200">
                  💡 Privilégiez des lectures légères, ne vous forcez pas
                </div>
              </div>
            </div>
          </div>

          <!-- Courants contraires -->
          <div class="bg-slate-800/60 rounded-xl p-3 border border-indigo-500/20">
            <div class="text-indigo-300 text-sm font-medium mb-2">Courants contraires détectés</div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Stress</span>
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div class="w-1/3 h-full bg-orange-400 rounded-full"></div>
                  </div>
                  <span class="text-xs text-orange-400">33%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Fatigue</span>
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div class="w-1/2 h-full bg-yellow-400 rounded-full"></div>
                  </div>
                  <span class="text-xs text-yellow-400">50%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Distractions</span>
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div class="w-1/4 h-full bg-red-400 rounded-full"></div>
                  </div>
                  <span class="text-xs text-red-400">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Milestone -->
      <div class="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 mb-6 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 text-yellow-400">🏆</div>
            <h3 class="text-cyan-400 font-bold" style="text-shadow: 0 0 8px rgba(6, 182, 212, 0.5)">PROCHAIN JALON</h3>
          </div>
          <span class="text-sm text-slate-300">{{ nextMilestone.days }} jours</span>
        </div>
        
        <div class="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div 
            class="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-1000"
            :style="{ 
              width: (nextMilestone.progress / nextMilestone.total) * 100 + '%',
              boxShadow: '0 0 12px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 146, 60, 0.4)'
            }"
          ></div>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-300">
            {{ nextMilestone.progress }} / {{ nextMilestone.total }} jours
          </span>
          <span class="text-xs text-yellow-400 font-medium">
            🏆 {{ nextMilestone.name }}
          </span>
        </div>
        <div class="text-xs text-slate-400 text-center mt-2">
          Palier {{ nextMilestone.tier }} • Série de 7 jours consécutifs
        </div>
      </div>
      <!-- ADN de Lecture Personnalisé -->
      <div class="bg-gradient-to-r from-emerald-800/40 to-teal-800/40 rounded-2xl p-4 border border-emerald-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-spin" style="animation-duration: 10s">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 class="text-emerald-400 font-bold" style="text-shadow: 0 0 8px rgba(16, 185, 129, 0.5)">🧬 ADN DE LECTURE PERSONNALISÉ</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Génome lecteur -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20">
            <div class="text-emerald-300 text-sm font-medium mb-3">Génome lecteur</div>
            <div class="relative">
              <!-- Visualisation ADN -->
              <svg class="w-full h-16" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#10b981" />
                    <stop offset="50%" stop-color="#14b8a6" />
                    <stop offset="100%" stop-color="#06b6d4" />
                  </linearGradient>
                </defs>
                
                <!-- Brins d'ADN -->
                <path
                  d="M0 15 Q25 10 50 15 T100 15 T150 15 T200 15"
                  stroke="url(#dnaGradient)"
                  stroke-width="2"
                  fill="none"
                  style="filter: drop-shadow(0 0 3px #10b981);"
                >
                  <animate
                    attributeName="d"
                    values="M0 15 Q25 10 50 15 T100 15 T150 15 T200 15;M0 15 Q25 20 50 15 T100 15 T150 15 T200 15;M0 15 Q25 10 50 15 T100 15 T150 15 T200 15"
                    dur="6s"
                    repeatCount="indefinite"/>
                </path>
                
                <path
                  d="M0 25 Q25 30 50 25 T100 25 T150 25 T200 25"
                  stroke="url(#dnaGradient)"
                  stroke-width="2"
                  fill="none"
                  style="filter: drop-shadow(0 0 3px #10b981);"
                >
                  <animate
                    attributeName="d"
                    values="M0 25 Q25 30 50 25 T100 25 T150 25 T200 25;M0 25 Q25 20 50 25 T100 25 T150 25 T200 25;M0 25 Q25 30 50 25 T100 25 T150 25 T200 25"
                    dur="6s"
                    repeatCount="indefinite"/>
                </path>
                
                <!-- Liaisons -->
                <g opacity="0.6">
                  <line x1="20" y1="13" x2="20" y2="27" stroke="#10b981" stroke-width="1"/>
                  <line x1="60" y1="15" x2="60" y2="25" stroke="#14b8a6" stroke-width="1"/>
                  <line x1="100" y1="15" x2="100" y2="25" stroke="#06b6d4" stroke-width="1"/>
                  <line x1="140" y1="15" x2="140" y2="25" stroke="#10b981" stroke-width="1"/>
                  <line x1="180" y1="13" x2="180" y2="27" stroke="#14b8a6" stroke-width="1"/>
                </g>
              </svg>
              
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div class="text-center">
                  <div class="text-xs text-emerald-400 mb-1">Vitesse</div>
                  <div class="text-sm font-bold text-white">{{ readingData.readingSpeed }} p/h</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-teal-400 mb-1">Endurance</div>
                  <div class="text-sm font-bold text-white">{{ avgSession }} min</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-cyan-400 mb-1">Genre favori</div>
                  <div class="text-sm font-bold text-white">Sci-Fi</div>
                </div>
              </div>
            </div>
        </div>
        
          <!-- Évolution -->
          <div class="bg-slate-800/60 rounded-xl p-3 border border-emerald-500/20">
            <div class="text-emerald-300 text-sm font-medium mb-2">Évolution détectée</div>
            <div class="text-white text-sm mb-2">Mutations de vos habitudes au fil des mois</div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span class="text-xs text-slate-400">Vitesse +15%</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span class="text-xs text-slate-400">Sessions +8min</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span class="text-xs text-slate-400">Régularité +23%</span>
              </div>
            </div>
          </div>

          <!-- Héritage comportemental -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20">
            <div class="text-emerald-300 text-sm font-medium mb-4">Héritages comportementaux</div>
            <div class="space-y-3">
              <!-- Héritage principal -->
              <div class="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span class="text-emerald-400 text-sm">🌙</span>
                  </div>
                  <div class="flex-1">
                    <div class="text-emerald-300 text-sm font-medium mb-1">Rituel du soir</div>
                    <div class="text-white text-sm leading-relaxed mb-2">
                      Cette semaine hérite de vos meilleures pratiques de mars car vous lisez en moyenne 45 min chaque soir depuis 12 jours pour compléter ce qui vous manque dans la journée
                    </div>
                    <div class="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                      Efficacité: +34% vs lecture matinale
                    </div>
                  </div>
                </div>
              </div>

              <!-- Héritage secondaire -->
              <div class="bg-teal-900/20 rounded-lg p-3 border border-teal-400/20">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span class="text-teal-400 text-sm">☔</span>
                  </div>
                  <div class="flex-1">
                    <div class="text-teal-300 text-sm font-medium mb-1">Boost météo</div>
                    <div class="text-white text-sm leading-relaxed mb-2">
                      Vous reproduisez instinctivement votre pattern d'octobre : les jours de pluie déclenchent des sessions 23% plus longues
                    </div>
                    <div class="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded inline-block">
                      Déclencheur: Temps gris + weekend
                    </div>
                  </div>
                </div>
              </div>

              <!-- Héritage tertiaire -->
              <div class="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span class="text-cyan-400 text-sm">📱</span>
                  </div>
                  <div class="flex-1">
                    <div class="text-cyan-300 text-sm font-medium mb-1">Transition digitale</div>
                    <div class="text-white text-sm leading-relaxed mb-2">
                      Vos micro-sessions de 15min reproduisent votre adaptation réussie de janvier lors des trajets quotidiens
                    </div>
                    <div class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded inline-block">
                      Impact: +2h30 par semaine
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pattern émergent -->
              <div class="bg-slate-700/40 rounded-lg p-3 border border-slate-500/30">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center mt-0.5">
                    <span class="text-slate-400 text-sm">⚡</span>
                  </div>
                  <div class="flex-1">
                    <div class="text-slate-300 text-sm font-medium mb-1">Pattern en formation</div>
                    <div class="text-white text-sm leading-relaxed mb-2">
                      Nouveau comportement détecté : vous tendez à relire les dernières pages avant chaque session depuis 8 jours
                    </div>
                    <div class="text-xs text-slate-400 bg-slate-600/20 px-2 py-1 rounded inline-block">
                      Probabilité de fixation: 73%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <div class="text-xs text-emerald-300 font-medium mb-1">Analyse comportementale</div>
              <div class="text-xs text-slate-300">
                Vos habitudes actuelles combinent 3 patterns éprouvés de votre historique. Cette synergie explique votre série actuelle de 8 jours.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bloc Pré/Post Lecture Émotionnel -->
      <div class="bg-gradient-to-r from-violet-800/40 to-purple-800/40 rounded-2xl p-4 mb-6 border border-violet-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-pulse">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 class="text-violet-400 font-bold" style="text-shadow: 0 0 8px rgba(139, 92, 246, 0.5)">🎭 ÉTAT ÉMOTIONNEL PRÉ/POST LECTURE</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Interface Pré-Lecture -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="text-violet-300 text-sm font-medium">État avant lecture</div>
              <div class="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">Sélection multiple</div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button 
                v-for="emotion in preReadingEmotions" 
                :key="emotion.id"
                @click="togglePreEmotion(emotion.id)"
                class="emotion-btn"
                :class="{ 
                  'active': emotion.selected,
                  'recorded': currentSession.preEmotionsRecorded
                }"
                :style="emotion.selected ? getEmotionNeonStyle() : {}"
              >
                <span class="emotion-icon" :class="{ 'neon-glow': emotion.selected }">{{ emotion.icon }}</span>
                <span class="emotion-label" :class="{ 'neon-text': emotion.selected }">{{ emotion.label }}</span>
              </button>
            </div>
            
            <div class="bg-violet-900/20 rounded-lg p-3 border border-violet-400/20">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-violet-300">Émotions sélectionnées :</div>
                <div class="flex items-center gap-2">
                  <div v-if="currentSession.preEmotionsRecorded" class="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">✓ Enregistré</div>
                  <button 
                    @click="recordPreEmotions"
                    :disabled="selectedPreEmotions.length === 0 || currentSession.preEmotionsRecorded"
                    class="emotion-record-btn"
                    :class="{ 'disabled': selectedPreEmotions.length === 0 || currentSession.preEmotionsRecorded }"
                  >
                    📝 Enregistrer
                  </button>
                </div>
              </div>
              <div class="text-sm text-white">
                {{ selectedPreEmotions.length > 0 ? selectedPreEmotions.join(', ') : 'Sélectionnez vos émotions avant lecture' }}
              </div>
            </div>
          </div>

          <!-- Interface Post-Lecture -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="text-violet-300 text-sm font-medium">État après lecture</div>
              <div class="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">Auto-évaluation</div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button 
                v-for="emotion in postReadingEmotions" 
                :key="emotion.id"
                @click="togglePostEmotion(emotion.id)"
                class="emotion-btn"
                :class="{ 
                  'active': emotion.selected,
                  'recorded': currentSession.postEmotionsRecorded
                }"
                :style="emotion.selected ? getEmotionNeonStyle() : {}"
              >
                <span class="emotion-icon" :class="{ 'neon-glow': emotion.selected }">{{ emotion.icon }}</span>
                <span class="emotion-label" :class="{ 'neon-text': emotion.selected }">{{ emotion.label }}</span>
              </button>
            </div>
            
            <div class="bg-violet-900/20 rounded-lg p-3 border border-violet-400/20">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-violet-300">Émotions post-lecture :</div>
                <div class="flex items-center gap-2">
                  <div v-if="currentSession.postEmotionsRecorded" class="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">✓ Enregistré</div>
                  <button 
                    @click="recordPostEmotions"
                    :disabled="selectedPostEmotions.length === 0 || !currentSession.preEmotionsRecorded || currentSession.postEmotionsRecorded"
                    class="emotion-record-btn"
                    :class="{ 'disabled': selectedPostEmotions.length === 0 || !currentSession.preEmotionsRecorded || currentSession.postEmotionsRecorded }"
                  >
                    📝 Enregistrer
                  </button>
                </div>
              </div>
              <div class="text-sm text-white mb-2">
                {{ selectedPostEmotions.length > 0 ? selectedPostEmotions.join(', ') : 'Sélectionnez vos émotions après lecture' }}
              </div>
              <div v-if="currentSession.canSave" class="flex justify-center">
                <button @click="saveSessionAndReset" class="session-save-btn">
                  💾 Sauvegarder la session et recommencer
                </button>
              </div>
            </div>
          </div>

          <!-- Historique des Sessions du Jour -->
          <div v-if="todaySessions.length > 0" class="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="text-violet-300 text-sm font-medium">Sessions d'aujourd'hui</div>
              <div class="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded">{{ todaySessions.length }} session(s)</div>
            </div>
            
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div v-for="session in todaySessions" :key="session.id" class="bg-slate-700/40 rounded-lg p-2 border border-slate-500/30">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-slate-300">{{ formatSessionTime(session.startTime) }}</div>
                  <div class="text-xs text-violet-400">Session #{{ session.id }}</div>
                </div>
                <div class="text-xs text-slate-400">
                  <span class="text-cyan-400">Avant:</span> {{ session.preEmotions.join(', ') }}
                </div>
                <div class="text-xs text-slate-400">
                  <span class="text-emerald-400">Après:</span> {{ session.postEmotions.join(', ') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Analyse des Corrélations -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-violet-500/20">
            <div class="text-violet-300 text-sm font-medium mb-3">Corrélations détectées ({{ emotionalSessions.length }} sessions analysées)</div>
            
            <div class="space-y-3">
              <div class="bg-emerald-900/20 rounded-lg p-3 border border-emerald-400/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-emerald-300 text-sm font-medium">Combo gagnant</div>
                  <div class="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">+34% vitesse</div>
                </div>
                <div class="text-xs text-slate-300">
                  Motivé + En forme + Curieux = Vos meilleures sessions (87% de réussite)
                </div>
              </div>
              
              <div class="bg-red-900/20 rounded-lg p-3 border border-red-400/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-red-300 text-sm font-medium">Combo à éviter</div>
                  <div class="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">-28% performance</div>
                </div>
                <div class="text-xs text-slate-300">
                  Fatigué + Stressé + Pressé = Abandon dans 73% des cas
                </div>
              </div>
              
              <div class="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-blue-300 text-sm font-medium">Pattern optimal</div>
                  <div class="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Recommandé</div>
                </div>
                <div class="text-xs text-slate-300">
                  Détendu + Curieux → Lecture plus longue et satisfaisante
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bloc Lecture Stratégique -->
      <div class="bg-gradient-to-r from-amber-800/40 to-orange-800/40 rounded-2xl p-4 mb-6 border border-amber-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 class="text-amber-400 font-bold" style="text-shadow: 0 0 8px rgba(245, 158, 11, 0.5)">🎯 ANALYSE STRATÉGIQUE DE LECTURE</h3>
        </div>
        
        <div class="space-y-4">
          <!-- ROI de Lecture -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div class="text-amber-300 text-sm font-medium mb-3">ROI de vos lectures</div>
            
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-amber-400">{{ readingROI.timeInvested }}h</div>
                <div class="text-xs text-slate-400">Temps investi</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-emerald-400">{{ readingROI.knowledgeGained }}</div>
                <div class="text-xs text-slate-400">Concepts appris</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-400">{{ readingROI.applicationsFound }}</div>
                <div class="text-xs text-slate-400">Applications pratiques</div>
              </div>
            </div>
            
            <div class="bg-amber-900/20 rounded-lg p-3 border border-amber-400/20">
              <div class="text-amber-300 text-sm font-medium mb-1">Efficacité stratégique</div>
              <div class="text-white text-sm mb-2">{{ readingROI.efficiency }}% de vos lectures atteignent leurs objectifs</div>
              <div class="w-full bg-slate-700 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full"
                  :style="{ width: readingROI.efficiency + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Analyse des Abandons -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div class="text-amber-300 text-sm font-medium mb-3">Analyse des abandons</div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-slate-300 text-sm">Taux de complétion</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full" :style="{ width: completionRate + '%' }"></div>
                  </div>
                  <span class="text-emerald-400 text-sm font-bold">{{ completionRate }}%</span>
                </div>
              </div>
              
              <div class="bg-red-900/20 rounded-lg p-3 border border-red-400/20">
                <div class="text-red-300 text-sm font-medium mb-2">Principales causes d'abandon</div>
                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Complexité excessive</span>
                    <span class="text-red-400">34%</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Manque de temps</span>
                    <span class="text-red-400">28%</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Perte d'intérêt</span>
                    <span class="text-red-400">23%</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-amber-900/20 rounded-lg p-3 border border-amber-400/20">
                <div class="text-amber-300 text-sm font-medium mb-1">Stratégie d'optimisation</div>
                <div class="text-xs text-slate-300">
                  Commencez par des livres de 200-250 pages dans vos genres favoris pour augmenter votre taux de complétion
                </div>
              </div>
            </div>
          </div>

          <!-- Objectifs de Lecture -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div class="text-amber-300 text-sm font-medium mb-3">Mapping des objectifs</div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-900/20 rounded-lg p-3 border border-blue-400/20">
                <div class="text-blue-300 text-sm font-medium mb-1">📚 Apprentissage</div>
                <div class="text-white text-lg font-bold">{{ objectives.learning }}%</div>
                <div class="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div class="bg-green-900/20 rounded-lg p-3 border border-green-400/20">
                <div class="text-green-300 text-sm font-medium mb-1">🎭 Plaisir</div>
                <div class="text-white text-lg font-bold">{{ objectives.pleasure }}%</div>
                <div class="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div class="bg-purple-900/20 rounded-lg p-3 border border-purple-400/20">
                <div class="text-purple-300 text-sm font-medium mb-1">🚀 Développement</div>
                <div class="text-white text-lg font-bold">{{ objectives.development }}%</div>
                <div class="text-xs text-slate-400">de vos lectures</div>
              </div>
              <div class="bg-cyan-900/20 rounded-lg p-3 border border-cyan-400/20">
                <div class="text-cyan-300 text-sm font-medium mb-1">🔬 Recherche</div>
                <div class="text-white text-lg font-bold">{{ objectives.research }}%</div>
                <div class="text-xs text-slate-400">de vos lectures</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bloc Équilibre Lecture -->
      <div class="bg-gradient-to-r from-rose-800/40 to-pink-800/40 rounded-2xl p-4 mb-6 border border-rose-500/30">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full">
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 class="text-rose-400 font-bold" style="text-shadow: 0 0 8px rgba(244, 63, 94, 0.5)">⚖️ ÉQUILIBRE DE LECTURE</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Répartition des Genres -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div class="text-rose-300 text-sm font-medium mb-3">Répartition par genre</div>
            
            <div class="space-y-3">
              <div v-for="genre in genreBalance" :key="genre.name" class="genre-balance-item">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-slate-300 text-sm">{{ genre.icon }} {{ genre.name }}</span>
                  <span class="text-rose-400 text-sm font-bold">{{ genre.percentage }}%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="genre.color"
                    :style="{ width: genre.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="mt-4 bg-rose-900/20 rounded-lg p-3 border border-rose-400/20">
              <div class="text-rose-300 text-sm font-medium mb-1">Score d'équilibre global</div>
              <div class="flex items-center gap-3">
                <div class="text-2xl font-bold text-white">{{ balanceScore }}%</div>
                <div class="flex-1">
                  <div class="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      class="bg-gradient-to-r from-rose-400 to-pink-400 h-full rounded-full"
                      :style="{ width: balanceScore + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="text-xs text-rose-400">{{ getBalanceLevel(balanceScore) }}</div>
              </div>
            </div>
          </div>

          <!-- Zones de Déséquilibre -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div class="text-rose-300 text-sm font-medium mb-3">Zones d'amélioration</div>
            
            <div class="space-y-2">
              <div class="bg-orange-900/20 rounded-lg p-3 border border-orange-400/20">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-orange-400 text-sm">⚠️</span>
                  <span class="text-orange-300 text-sm font-medium">Genre sous-représenté</span>
                </div>
                <div class="text-xs text-slate-300">
                  Biographies : seulement 8% de vos lectures. Essayez "Steve Jobs" ou "Marie Curie"
                </div>
              </div>
              
              <div class="bg-yellow-900/20 rounded-lg p-3 border border-yellow-400/20">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-yellow-400 text-sm">💡</span>
                  <span class="text-yellow-300 text-sm font-medium">Opportunité d'exploration</span>
                </div>
                <div class="text-xs text-slate-300">
                  Vous excellez en fiction (92% de complétion). Tentez la science-fiction pour élargir
                </div>
              </div>
            </div>
          </div>

          <!-- Suggestions de Rééquilibrage -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-rose-500/20">
            <div class="text-rose-300 text-sm font-medium mb-3">Plan de rééquilibrage</div>
            
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-rose-400 text-xs">1️⃣</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm font-medium">Cette semaine : 1 biographie courte</div>
                  <div class="text-xs text-slate-400">Objectif : découvrir ce genre sans pression</div>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-rose-400 text-xs">2️⃣</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm font-medium">Mois prochain : alterner fiction/non-fiction</div>
                  <div class="text-xs text-slate-400">Ratio cible : 60% fiction, 40% non-fiction</div>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <span class="text-rose-400 text-xs">3️⃣</span>
                </div>
                <div class="flex-1">
                  <div class="text-white text-sm font-medium">Objectif trimestre : explorer 2 nouveaux genres</div>
                  <div class="text-xs text-slate-400">Suggestions : Essais philosophiques, Récits de voyage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  props: {
    allData: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      isReading: false,
      sessionTime: 102, // 1:42 en secondes
      currentTime: new Date(),
      timerInterval: null,
      
      // État de la session émotionnelle
      currentSession: {
        id: null,
        startTime: null,
        preEmotionsRecorded: false,
        postEmotionsRecorded: false,
        canSave: false
      },
      
      // Historique des sessions émotionnelles
      emotionalSessions: [],
      
      // Données pour le bloc Pré/Post Lecture
      preReadingEmotions: [
        { id: 'motivated', icon: '🔥', label: 'Motivé', selected: false },
        { id: 'not_motivated', icon: '😐', label: 'Pas motivé', selected: false },
        { id: 'energetic', icon: '⚡', label: 'En forme', selected: false },
        { id: 'tired', icon: '😴', label: 'Fatigué', selected: false },
        { id: 'curious', icon: '🤔', label: 'Curieux', selected: false },
        { id: 'not_interested', icon: '😑', label: 'Pas envie', selected: false },
        { id: 'relaxed', icon: '😌', label: 'Détendu', selected: false },
        { id: 'stressed', icon: '😰', label: 'Stressé', selected: false },
        { id: 'focused', icon: '🎯', label: 'Concentré', selected: false },
        { id: 'rushed', icon: '⏰', label: 'Pressé', selected: false }
      ],
      
      postReadingEmotions: [
        { id: 'satisfied', icon: '😊', label: 'Satisfait', selected: false },
        { id: 'frustrated', icon: '😤', label: 'Frustré', selected: false },
        { id: 'inspired', icon: '✨', label: 'Inspiré', selected: false },
        { id: 'bored', icon: '😴', label: 'Ennuyé', selected: false },
        { id: 'enriched', icon: '🧠', label: 'Enrichi', selected: false },
        { id: 'confused', icon: '🤯', label: 'Confus', selected: false },
        { id: 'peaceful', icon: '🕊️', label: 'Apaisé', selected: false },
        { id: 'agitated', icon: '😣', label: 'Agité', selected: false },
        { id: 'concentrated', icon: '🎯', label: 'Concentré', selected: false },
        { id: 'distracted', icon: '🌪️', label: 'Distrait', selected: false }
      ]
    };
  },
  
  computed: {
    // Données cohérentes et calculées (identiques à votre code React)
    readingData() {
      return {
        streak: 8,
        todayMinutes: 95,
        dailyGoal: 45,
        pagesRemaining: 135,
        readingSpeed: 26, // pages/heure
        weeklyData: [
          { day: 'L', minutes: 45, completed: true },
          { day: 'M', minutes: 62, completed: true },
          { day: 'M', minutes: 38, completed: true },
          { day: 'J', minutes: 71, completed: true },
          { day: 'V', minutes: 55, completed: true },
          { day: 'S', minutes: 49, completed: true },
          { day: 'D', minutes: 95, completed: true }
        ]
      };
  },
  
    // Calculs automatiques pour la cohérence
    weeklyMinutes() {
      return this.readingData.weeklyData.reduce((sum, day) => sum + day.minutes, 0);
    },
    
    avgSession() {
      return Math.round(this.weeklyMinutes / this.readingData.weeklyData.length);
    },
    
    // Nouvelle métrique : Session minimale de la semaine
    weeklyMinSession() {
      const sessions = this.readingData.weeklyData.map(day => day.minutes);
      return Math.min(...sessions);
    },
    
    // Nouvelle métrique : Moyenne des sessions minimales (plus conservatrice)
    avgSessionMin() {
      const sessions = this.readingData.weeklyData.map(day => day.minutes);
      const sortedSessions = sessions.sort((a, b) => a - b);
      // Moyenne des 3 sessions les plus courtes
      const minSessions = sortedSessions.slice(0, 3);
      return Math.round(minSessions.reduce((sum, min) => sum + min, 0) / minSessions.length);
    },
    
    // Système de progression par paliers de 7 jours
    currentTier() {
      return Math.floor((this.readingData.streak - 1) / 7);
    },
    
    progressInTier() {
      return ((this.readingData.streak - 1) % 7) + 1;
    },
    
    tierProgress() {
      return this.progressInTier / 7;
    },
    
    nextMilestone() {
      return {
        name: this.currentTier === 0 ? "Badge « Régularité »" : this.currentTier === 1 ? "Badge « Discipline »" : "Badge « Maître »",
        progress: this.progressInTier,
        total: 7,
        days: 7 - this.progressInTier + 1,
        tier: this.currentTier + 1
      };
    },
    
    // Calcul du temps jusqu'à minuit
    timeUntilMidnight() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    },
    
    streakStatus() {
      const tier = Math.floor((this.readingData.streak - 1) / 7);
      if (tier >= 2) return { label: 'MAÎTRE', class: 'master' };
      if (tier >= 1) return { label: 'DISCIPLINE', class: 'discipline' };
      if (this.readingData.streak >= 3) return { label: 'RÉGULARITÉ', class: 'regularity' };
      return { label: 'DÉBUT', class: 'beginner' };
    },
    
    progressPercentage() {
      return Math.min((this.readingData.todayMinutes / this.readingData.dailyGoal) * 100, 100);
    },
    
    estimatedTimeLeft() {
      return (this.readingData.pagesRemaining / this.readingData.readingSpeed) * 60;
    },
    
    estimatedDays() {
      return Math.ceil(this.estimatedTimeLeft / this.avgSession);
    },
    
    dayProgressPercentage() {
      return ((24 * 60 * 60 - (this.timeUntilMidnight.hours * 3600 + this.timeUntilMidnight.minutes * 60 + this.timeUntilMidnight.seconds)) / (24 * 60 * 60)) * 100;
    },
    
    // Données pour les nouvelles sections
    heatmapSlots() {
      return [
        { hour: '6h', intensity: 20 },
        { hour: '8h', intensity: 45 },
        { hour: '12h', intensity: 60 },
        { hour: '14h', intensity: 35 },
        { hour: '17h', intensity: 70 },
        { hour: '19h', intensity: 95 },
        { hour: '21h', intensity: 85 },
        { hour: '23h', intensity: 25 }
      ];
    },
    
    weeklyScores() {
      return [95, 72, 68, 74, 89, 86, 78];
    },
    
    // Données pour les facteurs d'influence
    weatherFactors() {
      return {
        rain: { impact: '+15min', color: 'blue' },
        sun: { impact: '-8min', color: 'orange' },
        cloudy: { impact: 'Normal', color: 'gray' }
      };
    },
    
    // Données pour les phases de lecture
    readingPhases() {
      return {
        current: {
          name: 'Phase productive',
          duration: 'Depuis 14 jours',
          description: 'Période où vous avez naturellement plus d\'élan pour lire. Vous terminez vos sessions plus facilement et lisez plus longtemps.',
          tip: '✓ Profitez-en pour tackle des livres plus challenging'
        },
        next: {
          name: 'Phase tranquille',
          duration: 'Dans ~7 jours',
          description: 'Période de récupération naturelle où l\'envie de lire diminue temporairement. C\'est normal et prévisible.',
          tip: '💡 Privilégiez des lectures légères, ne vous forcez pas'
        }
      };
    },
    
    // Données pour l'héritage comportemental
    behavioralHeritage() {
      return [
        {
          type: 'primary',
          icon: '🌙',
          title: 'Rituel du soir',
          description: 'Cette semaine hérite de vos meilleures pratiques de mars car vous lisez en moyenne 45 min chaque soir depuis 12 jours pour compléter ce qui vous manque dans la journée',
          impact: 'Efficacité: +34% vs lecture matinale'
        },
        {
          type: 'secondary',
          icon: '☔',
          title: 'Boost météo',
          description: 'Vous reproduisez instinctivement votre pattern d\'octobre : les jours de pluie déclenchent des sessions 23% plus longues',
          impact: 'Déclencheur: Temps gris + weekend'
        },
        {
          type: 'tertiary',
          icon: '📱',
          title: 'Transition digitale',
          description: 'Vos micro-sessions de 15min reproduisent votre adaptation réussie de janvier lors des trajets quotidiens',
          impact: 'Impact: +2h30 par semaine'
        },
        {
          type: 'emergent',
          icon: '⚡',
          title: 'Pattern en formation',
          description: 'Nouveau comportement détecté : vous tendez à relire les dernières pages avant chaque session depuis 8 jours',
          impact: 'Probabilité de fixation: 73%'
        }
      ];
    },
    
    // Fonction pour déterminer le statut du streak
    streakStatus() {
      const tier = Math.floor((this.readingData.streak - 1) / 7);
      if (tier >= 2) return { label: 'MAÎTRE', class: 'master', color: 'from-purple-400 to-pink-500' };
      if (tier >= 1) return { label: 'DISCIPLINE', class: 'discipline', color: 'from-emerald-400 to-teal-500' };
      if (this.readingData.streak >= 3) return { label: 'RÉGULARITÉ', class: 'regularity', color: 'from-blue-400 to-cyan-500' };
      return { label: 'DÉBUT', class: 'beginner', color: 'from-gray-400 to-slate-500' };
    },
    
    // Calcul du temps jusqu'à minuit (dépend de currentTime pour se mettre à jour)
    timeUntilMidnight() {
      const now = this.currentTime;
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    },
    
    // Calcul du pourcentage de progression de la journée (dépend de currentTime)
    dayProgressPercentage() {
      const timeLeft = this.timeUntilMidnight;
      const totalSecondsInDay = 24 * 60 * 60;
      const remainingSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
      return ((totalSecondsInDay - remainingSeconds) / totalSecondsInDay) * 100;
    },
    
    // Données pour le bloc Pré/Post Lecture
    selectedPreEmotions() {
      return this.preReadingEmotions.filter(e => e.selected).map(e => e.label);
    },
    
    selectedPostEmotions() {
      return this.postReadingEmotions.filter(e => e.selected).map(e => e.label);
    },
    
    emotionalTransformation() {
      if (this.selectedPreEmotions.length === 0 || this.selectedPostEmotions.length === 0) {
        return 'Complétez votre évaluation pour voir la transformation';
      }
      return `${this.selectedPreEmotions.join(', ')} → ${this.selectedPostEmotions.join(', ')}`;
    },
    
    // Sessions d'aujourd'hui
    todaySessions() {
      const today = new Date().toDateString();
      return this.emotionalSessions.filter(session => 
        new Date(session.startTime).toDateString() === today
      );
    },
    
    // Données pour le bloc Lecture Stratégique
    readingROI() {
      return {
        timeInvested: Math.round(this.weeklyMinutes / 60 * 4.3), // Estimation mensuelle
        knowledgeGained: 47, // Concepts appris estimés
        applicationsFound: 12, // Applications pratiques
        efficiency: 78 // % d'objectifs atteints
      };
    },
    
    completionRate() {
      return 84; // % de livres terminés
    },
    
    objectives() {
      return {
        learning: 45,    // % lectures d'apprentissage
        pleasure: 35,    // % lectures plaisir
        development: 15, // % développement personnel
        research: 5      // % recherche/travail
      };
    },
    
    // Données pour le bloc Équilibre Lecture
    genreBalance() {
      return [
        { name: 'Fiction', icon: '📚', percentage: 42, color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
        { name: 'Non-fiction', icon: '📖', percentage: 28, color: 'bg-gradient-to-r from-green-400 to-green-500' },
        { name: 'Développement', icon: '🚀', percentage: 15, color: 'bg-gradient-to-r from-purple-400 to-purple-500' },
        { name: 'Biographies', icon: '👤', percentage: 8, color: 'bg-gradient-to-r from-orange-400 to-orange-500' },
        { name: 'Sciences', icon: '🔬', percentage: 7, color: 'bg-gradient-to-r from-cyan-400 to-cyan-500' }
      ];
    },
    
    balanceScore() {
      // Calcul du score d'équilibre basé sur la diversité
      const genres = this.genreBalance;
      const total = genres.reduce((sum, g) => sum + g.percentage, 0);
      const idealDistribution = 100 / genres.length; // Répartition idéale
      const variance = genres.reduce((sum, g) => sum + Math.pow(g.percentage - idealDistribution, 2), 0) / genres.length;
      return Math.max(0, Math.round(100 - (variance / 10))); // Score inversé de la variance
    }
  },
  
  methods: {
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Méthodes pour le timer interactif (identique à React)
    toggleReading() {
      this.isReading = !this.isReading;
    },
    
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
      if (this.isReading) {
        this.sessionTime += 1;
      }
    }, 1000);
  },
  
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    
    updateSessionTime() {
      if (this.isReading) {
        this.sessionTime++;
      }
    },
    
    updateCurrentTime() {
      this.currentTime = new Date();
    },
    
    getPerformanceLevel(minutes) {
      if (minutes >= 60) return 'excellent';
      if (minutes >= 45) return 'bon';
      return 'correct';
    },
    
    // Méthodes pour le bloc Pré/Post Lecture
    togglePreEmotion(emotionId) {
      if (this.currentSession.preEmotionsRecorded) return; // Empêche la modification après enregistrement
      
      const emotion = this.preReadingEmotions.find(e => e.id === emotionId);
      if (emotion) {
        emotion.selected = !emotion.selected;
      }
    },
    
    togglePostEmotion(emotionId) {
      if (this.currentSession.postEmotionsRecorded) return; // Empêche la modification après enregistrement
      
      const emotion = this.postReadingEmotions.find(e => e.id === emotionId);
      if (emotion) {
        emotion.selected = !emotion.selected;
      }
    },
    
    // Enregistrer les émotions pré-lecture
    recordPreEmotions() {
      if (this.selectedPreEmotions.length === 0) {
        console.warn('⚠️ Aucune émotion sélectionnée pour l\'enregistrement pré-lecture');
        return;
      }
      
      if (this.currentSession.preEmotionsRecorded) {
        console.warn('⚠️ Émotions pré-lecture déjà enregistrées pour cette session');
        return;
      }
      
      // Créer une nouvelle session si pas encore créée
      if (!this.currentSession.id) {
        this.currentSession = {
          id: Date.now(),
          startTime: new Date(),
          preEmotionsRecorded: false,
          postEmotionsRecorded: false,
          canSave: false
        };
      }
      
      this.currentSession.preEmotionsRecorded = true;
    },
    
    // Enregistrer les émotions post-lecture
    recordPostEmotions() {
      if (this.selectedPostEmotions.length === 0) {
        console.warn('⚠️ Aucune émotion post-lecture sélectionnée');
        return;
      }
      
      if (!this.currentSession.preEmotionsRecorded) {
        console.warn('⚠️ Impossible d\'enregistrer post-lecture sans pré-lecture');
        return;
      }
      
      if (this.currentSession.postEmotionsRecorded) {
        console.warn('⚠️ Émotions post-lecture déjà enregistrées pour cette session');
        return;
      }
      
      this.currentSession.postEmotionsRecorded = true;
      this.currentSession.canSave = true;
    },
    
    // Sauvegarder la session complète et reset
    saveSessionAndReset() {
      if (!this.currentSession.canSave) {
        console.warn('⚠️ Session non prête pour la sauvegarde');
        return;
      }
      
      if (!this.currentSession.preEmotionsRecorded || !this.currentSession.postEmotionsRecorded) {
        console.warn('⚠️ Session incomplète - pré et post émotions requis');
        return;
      }
      
      // Sauvegarder la session dans l'historique
      const sessionData = {
        id: this.currentSession.id,
        startTime: this.currentSession.startTime,
        endTime: new Date(),
        preEmotions: [...this.selectedPreEmotions],
        postEmotions: [...this.selectedPostEmotions],
        duration: Math.round((new Date() - this.currentSession.startTime) / 1000 / 60) // durée en minutes
      };
      
      this.emotionalSessions.push(sessionData);
      
      // Sauvegarder dans localStorage avec gestion d'erreur
      try {
        localStorage.setItem('emotional-reading-sessions', JSON.stringify(this.emotionalSessions));
      } catch (error) {
        console.error('❌ Erreur sauvegarde localStorage:', error);
      }
      
      // Reset complet pour nouvelle session
      this.resetEmotionalState();
      
    },
    
    // Reset complet de l'état émotionnel
    resetEmotionalState() {
      // Reset des sélections
      this.preReadingEmotions.forEach(e => e.selected = false);
      this.postReadingEmotions.forEach(e => e.selected = false);
      
      // Reset de la session
      this.currentSession = {
        id: null,
        startTime: null,
        preEmotionsRecorded: false,
        postEmotionsRecorded: false,
        canSave: false
      };
    },
    
    // Formater l'heure d'une session
    formatSessionTime(dateTime) {
      return new Date(dateTime).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },
    
    // Charger l'historique depuis localStorage
    loadEmotionalSessions() {
      try {
        const saved = localStorage.getItem('emotional-reading-sessions');
        if (saved) {
          this.emotionalSessions = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sessions:', error);
        this.emotionalSessions = [];
      }
    },
    
    // Analyser les corrélations en temps réel
    analyzeEmotionalCorrelations() {
      if (this.emotionalSessions.length < 3) return null;
      
      // Analyser les patterns de succès
      const successfulSessions = this.emotionalSessions.filter(s => 
        s.postEmotions.includes('Satisfait') || s.postEmotions.includes('Inspiré') || s.postEmotions.includes('Enrichi')
      );
      
      const failedSessions = this.emotionalSessions.filter(s => 
        s.postEmotions.includes('Frustré') || s.postEmotions.includes('Ennuyé') || s.postEmotions.includes('Confus')
      );
      
      
      return {
        successRate: Math.round((successfulSessions.length / this.emotionalSessions.length) * 100),
        bestPreCombos: this.findBestEmotionalCombos(successfulSessions),
        worstPreCombos: this.findWorstEmotionalCombos(failedSessions)
      };
    },
    
    // Trouver les meilleures combinaisons émotionnelles
    findBestEmotionalCombos(sessions) {
      const combos = {};
      sessions.forEach(session => {
        const combo = session.preEmotions.sort().join(' + ');
        combos[combo] = (combos[combo] || 0) + 1;
      });
      
      const bestCombo = Object.entries(combos).sort((a, b) => b[1] - a[1])[0];
      return bestCombo ? { combo: bestCombo[0], count: bestCombo[1] } : null;
    },
    
    // Trouver les pires combinaisons émotionnelles
    findWorstEmotionalCombos(sessions) {
      const combos = {};
      sessions.forEach(session => {
        const combo = session.preEmotions.sort().join(' + ');
        combos[combo] = (combos[combo] || 0) + 1;
      });
      
      const worstCombo = Object.entries(combos).sort((a, b) => b[1] - a[1])[0];
      return worstCombo ? { combo: worstCombo[0], count: worstCombo[1] } : null;
    },
    
    // Méthode pour le bloc Équilibre Lecture
    getBalanceLevel(score) {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Bon';
      if (score >= 40) return 'Moyen';
      return 'À améliorer';
    },
    
    // Générer le style néon dynamique - INSTANTANÉ
    getEmotionNeonStyle() {
      return {
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.5)) !important',
        border: '2px solid #8b5cf6 !important',
        boxShadow: `
          0 0 25px rgba(139, 92, 246, 0.7),
          0 0 50px rgba(139, 92, 246, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3) !important
        `,
        transform: 'scale(1.08) !important',
        transition: 'none !important',
        animation: 'neonPulse 1.5s ease-in-out infinite alternate'
      };
    },
    
    // Injecter les styles CSS dynamiquement
    injectEmotionStyles() {
      // Vérifier si les styles sont déjà injectés
      if (document.getElementById('reading-rhythm-emotion-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'reading-rhythm-emotion-styles';
      style.textContent = `
        @keyframes neonPulse {
          0% { 
            box-shadow: 
              0 0 25px rgba(139, 92, 246, 0.7),
              0 0 50px rgba(139, 92, 246, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
          100% { 
            box-shadow: 
              0 0 35px rgba(139, 92, 246, 0.9),
              0 0 70px rgba(139, 92, 246, 0.6),
              0 0 100px rgba(139, 92, 246, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }
        
        /* Animation instantanée pour la sélection */
        @keyframes instantNeon {
          0% { 
            transform: scale(1);
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
          }
          100% { 
            transform: scale(1.08);
            box-shadow: 
              0 0 25px rgba(139, 92, 246, 0.7),
              0 0 50px rgba(139, 92, 246, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }
        
        @keyframes iconGlow {
          0% { filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8)); }
          100% { filter: drop-shadow(0 0 15px rgba(139, 92, 246, 1)); }
        }
        
        .emotion-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(51, 65, 85, 0.6);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          transition: transform 0.05s ease-out, background 0.05s ease-out, border 0.05s ease-out;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          will-change: transform, box-shadow, background, border;
        }
        
        .emotion-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.4);
          transform: translateY(-1px);
        }
        
        .emotion-record-btn {
          padding: 6px 12px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        
        .emotion-record-btn:hover:not(.disabled) {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .emotion-record-btn.disabled {
          background: rgba(71, 85, 105, 0.5);
          color: rgba(148, 163, 184, 0.7);
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .session-save-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .session-save-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        
        /* Styles pour les icônes et labels plus réactifs */
        .emotion-icon, .emotion-label {
          transition: all 0.05s ease-out;
          will-change: filter, text-shadow, color;
        }
        
        /* Effet néon instantané sur les éléments sélectionnés */
        .neon-glow {
          filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.9)) !important;
          transition: filter 0.05s ease-out !important;
        }
        
        .neon-text {
          color: #ffffff !important;
          text-shadow: 0 0 12px rgba(139, 92, 246, 0.9) !important;
          font-weight: 700 !important;
          transition: all 0.05s ease-out !important;
        }
      `;
      
      document.head.appendChild(style);
    }
  },
  
  mounted() {
    // Démarrer le timer (identique à useEffect de React)
    this.startTimer();
    
    // Charger l'historique des sessions émotionnelles
    this.loadEmotionalSessions();
    
    // Injecter les styles CSS pour les nouveaux blocs
    this.injectEmotionStyles();
    
  },
  
  beforeUnmount() {
    // Nettoyer le timer (identique à cleanup de useEffect)
    this.stopTimer();
  }
};
