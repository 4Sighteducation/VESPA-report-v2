<template>
  <div class="vespa-profile-display" data-vespa-academic-profile="1">
    <section class="vespa-section profile-section" :class="{ 'ks4-theme': isKs4 }">
      <div class="profile-header">
        <div class="profile-header-left">
          <div class="profile-avatar" aria-hidden="true">{{ studentInitials }}</div>
          <div class="profile-header-text">
            <div class="profile-title-row">
              <div class="profile-title">Student Profile</div>
              <button class="profile-info-button" type="button" @click="showInfoModal = true" title="Understanding These Grades">
                i
              </button>
            </div>
            <div class="profile-student-name">{{ displayStudentName }}</div>
            <div class="profile-meta">
              <div class="profile-meta-item">
                <span class="profile-meta-label">School</span>
                <span class="profile-meta-value">{{ displaySchool }}</span>
              </div>
              <div v-if="displayYearGroup" class="profile-meta-item">
                <span class="profile-meta-label">Year</span>
                <span class="profile-meta-value">{{ displayYearGroup }}</span>
              </div>
              <div v-if="displayTutorGroup" class="profile-meta-item">
                <span class="profile-meta-label">Tutor</span>
                <span class="profile-meta-value">{{ displayTutorGroup }}</span>
              </div>
              <div v-if="!isKs4 && student.priorAttainment" class="profile-meta-item">
                <span class="profile-meta-label">Prior</span>
                <span class="profile-meta-value">{{ student.priorAttainment }}</span>
              </div>
              <div v-if="!isKs4 && student.attendance" class="profile-meta-item">
                <span class="profile-meta-label">Attendance</span>
                <span class="profile-meta-value">{{ formatPercentage(student.attendance) }}</span>
              </div>
              <div v-if="formattedUpdatedAt" class="profile-meta-item">
                <span class="profile-meta-label">Updated</span>
                <span class="profile-meta-value">{{ formattedUpdatedAt }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            type="button"
            @click="toggleMeg"
            :title="showMeg ? 'Hide MEG' : 'Show MEG'">
            MEG: {{ showMeg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            type="button"
            @click="toggleStg"
            :title="showStg ? 'Hide STG' : 'Show STG'">
            STG: {{ showStg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && isKs4"
            class="small-toggle"
            type="button"
            @click="togglePredicted"
            :title="showPredicted ? 'Hide Predicted Grade' : 'Show Predicted Grade'">
            Predicted: {{ showPredicted ? 'On' : 'Off' }}
          </button>

          <span v-if="editable && isStaff"
                class="master-edit-icon"
                :class="isEditMode ? 'save-icon' : 'edit-icon'"
                @click="toggleEditMode"
                :title="isEditMode ? 'Save All Changes' : 'Edit All Grades'">
            {{ isEditMode ? '💾 Save All' : '✏️ Edit Grades' }}
          </span>

          <span v-if="editable && isStudent"
                class="master-edit-icon"
                :class="isEditMode ? 'save-icon' : 'edit-icon'"
                @click="toggleEditMode"
                :title="isEditMode ? 'Save Target Grades' : 'Edit Target Grades'">
            {{ isEditMode ? '💾 Save Targets' : '✏️ Edit Targets' }}
          </span>
        </div>
      </div>

      <div class="profile-info" :class="{ 'ks4-layout': isKs4, 'ks5-layout': !isKs4 }">
        <!-- Subjects Grid -->
        <div class="subjects-container">
          <div class="subjects-grid" :class="{ 'ks4-grid': isKs4 }">
            <template v-if="isKs4">
              <SubjectCardKs4
                v-for="subject in subjects"
                :key="subject.id || subject.position"
                :subject="subject"
                :edit-mode="isEditMode"
                :is-staff="isStaff"
                :allow-student-target-edit="editable && isStudent"
                :show-predicted="showPredicted"
                @update="handleSubjectUpdate"
              />
            </template>
            <template v-else>
              <SubjectCard
                v-for="subject in subjects"
                :key="subject.id || subject.position"
                :subject="subject"
                :edit-mode="isEditMode"
                :is-staff="isStaff"
                :allow-student-target-edit="editable && isStudent"
                :show-meg="showMeg"
                :show-stg="showStg"
                @update="handleSubjectUpdate"
              />
            </template>
          </div>
          
          <div v-if="subjects.length === 0" class="no-subjects">
            No subjects available
          </div>

          <!-- University Choices (KS5 / Level 3 only) -->
          <div v-if="!isKs4" class="university-offers">
            <div class="university-offers-header">
              <div class="offers-header-left">
                <div class="offers-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div class="offers-title-group">
                  <div class="university-offers-title">University Choices</div>
                  <div class="offers-count">{{ offers.length }} {{ offers.length === 1 ? 'university' : 'universities' }} saved</div>
                </div>
              </div>
              <div class="university-offers-actions">
                <button
                  class="offers-ucasapp-btn"
                  type="button"
                  @click="openUcasApplication"
                  :disabled="offers.length === 0"
                  :title="offers.length ? 'Write your UCAS 3-question statement' : 'Add a University Choice first'">
                  {{ isStudent ? '📝 UCAS Application' : '👀 View UCAS Application' }}
                </button>
                <button
                  v-if="offersEditable"
                  class="offers-edit-btn"
                  @click="openOffersEditor"
                  title="Open UniGuide to build your 5 university choices">
                  🔎 UniGuide
                </button>
                <button
                  v-if="offers.length > 0"
                  class="offers-toggle-btn"
                  :disabled="offers.length <= 1"
                  @click="toggleOffersExpanded">
                  <span class="offers-chevron" :class="{ open: offersExpanded }">▾</span>
                  {{ offersExpanded ? 'Hide choices' : `View choices (${offers.length})` }}
                </button>
              </div>
            </div>

            <button
              v-if="topOffer"
              type="button"
              class="university-offers-top offer-top-toggle"
              :title="offers.length > 1 ? 'Click to expand/collapse all offers' : 'Top offer'"
              @click="offers.length > 1 ? toggleOffersExpanded() : null">
              <div class="offer-line">
                <span class="offer-rank">#{{ topOffer.ranking }}</span>
                <span class="offer-uni">{{ topOffer.universityName || 'University' }}</span>
                <span class="offer-course" v-if="topOffer.courseTitle">— {{ topOffer.courseTitle }}</span>
              </div>
              <div class="offer-meta">
                <span v-if="topOffer.offer" class="offer-pill">Offer: {{ topOffer.offer }}</span>
                <span v-if="topOffer.ucasPoints !== null && topOffer.ucasPoints !== undefined && topOffer.ucasPoints !== ''" class="offer-pill">
                  UCAS: {{ topOffer.ucasPoints }}
                </span>
                <a
                  v-if="safeCourseLink(topOffer.courseLink)"
                  class="offer-link-btn"
                  :href="safeCourseLink(topOffer.courseLink)"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                >
                  🔗 Course link
                </a>
              </div>
              <div v-if="offers.length > 1" class="offer-expand-hint">
                <span class="offers-chevron" :class="{ open: offersExpanded }">▾</span>
                <span>{{ offersExpanded ? 'Click to collapse' : 'Click to expand' }}</span>
              </div>
            </button>

            <div v-else class="university-offers-empty">
              <span>No choices added yet.</span>
              <button v-if="offersEditable" class="offers-add-btn" @click="openOffersEditor">➕ Add choices</button>
            </div>

            <div v-if="offersExpanded && offers.length" class="university-offers-list" aria-label="All university choices">
              <div v-for="o in sortedOffers" :key="o._key" class="offer-item">
                <div class="offer-line">
                  <span class="offer-rank">#{{ o.ranking }}</span>
                  <span class="offer-uni">{{ o.universityName || 'University' }}</span>
                  <span class="offer-course" v-if="o.courseTitle">— {{ o.courseTitle }}</span>
                </div>
                <div class="offer-meta">
                  <span v-if="o.offer" class="offer-pill">Offer: {{ o.offer }}</span>
                  <span v-if="o.ucasPoints !== null && o.ucasPoints !== undefined && o.ucasPoints !== ''" class="offer-pill">
                    UCAS: {{ o.ucasPoints }}
                  </span>
                  <a
                    v-if="safeCourseLink(o.courseLink)"
                    class="offer-link-btn"
                    :href="safeCourseLink(o.courseLink)"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                  >
                    🔗 Course link
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data source indicator (subtle dot for admin) -->
      <div v-if="dataSource" class="data-source-dot" 
           :class="dataSource === 'supabase' ? 'live-source' : 'fallback-source'"
           :title="`Data loaded from ${dataSource === 'supabase' ? 'Supabase (live)' : 'Knack (fallback)'}`">
      </div>
    </section>

    <!-- Info Modal -->
    <InfoModal 
      v-if="showInfoModal" 
      :is-staff="isStaff"
      :is-ks4="isKs4"
      @close="showInfoModal = false" 
    />

    <!-- UCAS Application Modal -->
    <UcasApplicationModal
      v-if="ucasModalOpen"
      :student-email="props.student?.email || ''"
      :academic-year="props.academicYear || ''"
      :subjects="props.subjects || []"
      :offers="sortedOffers"
      :top-offer="topOffer"
      :api-url="academicProfileApiUrl"
      :can-edit="isStudent"
      :comments-enabled="true"
      :can-add-comment="isStaff"
      :staff-email="currentUserEmail"
      @close="ucasModalOpen = false"
    />

    <!-- Saving Overlay -->
    <div v-if="saving" class="saving-overlay">
      <div class="spinner"></div>
      <p>Saving changes...</p>
    </div>

    <!-- UniGuide Modal (includes manual editor) -->
    <div v-if="offersEditorOpen" class="offers-modal-overlay" @click.self="closeOffersEditor">
      <div class="offers-modal" role="dialog" aria-modal="true" aria-label="UniGuide">
        <div v-if="toast.open" class="toast" :class="toast.type" role="status" aria-live="polite">
          <div class="toast-inner">
            <div class="toast-msg">{{ toast.message }}</div>
            <button class="toast-close" type="button" @click="closeToast" aria-label="Dismiss">×</button>
          </div>
        </div>
        <div class="modal-header">
          <div class="modal-top">
            <div class="modal-brand">
              <div class="brand-icon" aria-hidden="true">🎓</div>
              <div class="brand-text">
                <h2>UniGuide</h2>
                <p>AI-powered university discovery · VESPA Academy</p>
              </div>
            </div>

            <div class="modal-actions-right">
              <div class="student-pill">
                <div class="student-avatar">{{ studentInitials }}</div>
                <div class="student-info">
                  <strong>{{ displayStudentName }}</strong>
                  {{ displayYearGroup || '—' }}
                </div>
              </div>
          <a
            class="offers-ucas-link"
            href="https://www.ucas.com/"
            target="_blank"
            rel="noopener noreferrer"
                title="Open UCAS in a new tab"
              >
            🔎 UCAS search
          </a>
              <button class="close-btn" type="button" @click="closeOffersEditor" aria-label="Close UniGuide">×</button>
        </div>
          </div>

          <div class="tabs" role="tablist" aria-label="UniGuide tabs">
            <button
              class="tab"
              :class="{ active: offersEditorTab === 'ai' }"
              type="button"
              role="tab"
              :aria-selected="offersEditorTab === 'ai'"
              @click="offersEditorTab = 'ai'"
            >
              <span class="tab-icon" aria-hidden="true">💬</span>
              AI Advisor
              <span class="tab-badge">NEW</span>
            </button>
            <button
              class="tab"
              :class="{ active: offersEditorTab === 'search' }"
              type="button"
              role="tab"
              :aria-selected="offersEditorTab === 'search'"
              @click="offersEditorTab = 'search'"
            >
              <span class="tab-icon" aria-hidden="true">🔍</span>
              Search Courses
            </button>
            <button
              class="tab"
              :class="{ active: offersEditorTab === 'manual' }"
              type="button"
              role="tab"
              :aria-selected="offersEditorTab === 'manual'"
              @click="offersEditorTab = 'manual'"
            >
              <span class="tab-icon" aria-hidden="true">📋</span>
              My Shortlist
              <span class="tab-badge tab-badge-blue">{{ nonEmptyOffersDraftCount }}</span>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <!-- ── TAB: AI ADVISOR ──────────────────────────────────────────── -->
          <div class="tab-content" :class="{ active: offersEditorTab === 'ai' }" role="tabpanel">
            <div class="ai-layout">
              <div class="ai-sidebar">
                <div class="sidebar-label">Your Profile</div>

                <div class="sidebar-stat">
                  <span class="stat-icon" aria-hidden="true">👤</span>
                  <div class="stat-body">
                    <div class="stat-label">Student</div>
                    <div class="stat-value">{{ displayStudentName }}</div>
                  </div>
                </div>

                <div class="sidebar-stat">
                  <span class="stat-icon" aria-hidden="true">📚</span>
                  <div class="stat-body">
                    <div class="stat-label">Subjects</div>
                    <div class="stat-value">{{ uniguideSubjectsSummary }}</div>
                  </div>
                </div>

                <div class="sidebar-stat">
                  <span class="stat-icon" aria-hidden="true">✅</span>
                  <div class="stat-body">
                    <div class="stat-label">Draft choices</div>
                    <div class="stat-value">{{ nonEmptyOffersDraftCount }} / 5</div>
                  </div>
                </div>

                <div class="phase-indicator">
                  <div class="phase-label">Conversation</div>
                  <div class="phase-steps">
                    <div class="phase-step" :class="{ done: uniguidePhaseIndex > 0, current: uniguidePhaseIndex === 0 }">
                      <div class="phase-dot"></div>
                      Opening
                    </div>
                    <div class="phase-step" :class="{ done: uniguidePhaseIndex > 1, current: uniguidePhaseIndex === 1 }">
                      <div class="phase-dot"></div>
                      Probing
                    </div>
                    <div class="phase-step" :class="{ done: uniguidePhaseIndex > 2, current: uniguidePhaseIndex === 2 }">
                      <div class="phase-dot"></div>
                      Practicalities
                    </div>
                    <div class="phase-step" :class="{ done: uniguidePhaseIndex > 3, current: uniguidePhaseIndex === 3 }">
                      <div class="phase-dot"></div>
                      Constraints
                    </div>
                    <div class="phase-step" :class="{ done: uniguidePhaseIndex > 4, current: uniguidePhaseIndex === 4 }">
                      <div class="phase-dot"></div>
                      Summary
                    </div>
                  </div>
                </div>

                <div class="sidebar-label">Preferences</div>
                <div v-if="uniguideProfileError" class="inline-error">{{ uniguideProfileError }}</div>
                <div v-else-if="uniguideProfileLoading" class="inline-muted">Loading…</div>
                <div v-else class="prefs-summary">
                  <div class="prefs-summary-row">
                    <div class="prefs-summary-label">Completed</div>
                    <div class="prefs-summary-value">
                      <span class="status-pill" :class="{ ok: uniguidePrefsCompleted }">{{ uniguidePrefsCompleted ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="prefs-summary-row" v-if="(uniguideIntake.interests || []).length">
                    <div class="prefs-summary-label">Interests</div>
                    <div class="prefs-summary-value">{{ (uniguideIntake.interests || []).slice(0, 3).join(', ') }}<span v-if="(uniguideIntake.interests || []).length > 3">…</span></div>
                  </div>
                  <div class="prefs-summary-row" v-if="uniguideIntake.distance">
                    <div class="prefs-summary-label">Distance</div>
                    <div class="prefs-summary-value">{{ uniguideIntake.distance }}</div>
                  </div>
                  <div class="prefs-summary-row" v-if="uniguideIntake.campus_type">
                    <div class="prefs-summary-label">Campus</div>
                    <div class="prefs-summary-value">{{ uniguideIntake.campus_type }}</div>
                  </div>
                </div>

                <div class="sidebar-actions">
                  <button class="side-btn primary" type="button" @click="openUniGuidePrefs">
                    {{ uniguidePrefsCompleted ? 'Edit preferences' : 'Complete preferences' }}
                  </button>
                </div>

                <div class="sidebar-label">AI Shortlist</div>
                <div v-if="uniguideSuggestions.length === 0" class="inline-muted">
                  Ask the AI and it’ll add suggestions here.
                </div>
                <div v-else class="sidebar-shortlist">
                  <div v-for="s in uniguideSuggestions" :key="s.course_key" class="course-card" :class="{ saved: isUniGuideCourseSaved(s) }">
                    <div class="uni-logo">{{ (s.institution_name || 'UNI').slice(0,3).toUpperCase() }}</div>
                    <div class="course-info">
                      <div class="course-name">{{ s.title || 'Course' }}</div>
                      <div class="uni-name">{{ s.institution_name || 'Institution' }}</div>
                      <div v-if="s.reason_short" class="ai-reason">
                        <div class="ai-reason-label">Why this</div>
                        {{ s.reason_short }}
                      </div>
                      <div class="course-tags" style="margin-top:8px;">
                        <a v-if="s.course_url" class="save-btn" :href="s.course_url" target="_blank" rel="noopener noreferrer" @click.stop>🔗 Course</a>
                        <button class="save-btn" type="button" :class="{ saved: isUniGuideCourseSaved(s) }" @click.stop="addUniGuideCourseToDraft(s)">
                          {{ isUniGuideCourseSaved(s) ? 'Saved' : 'Save' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="chat-area">
                <div ref="uniguideChatScrollEl" class="chat-messages" aria-label="UniGuide chat">
                  <div v-if="uniguideChatMessages.length === 0" class="msg ai">
                    <div class="msg-avatar" aria-hidden="true">UG</div>
                    <div>
                      <div class="msg-bubble">
                        Tell me what you’re looking for (subjects you enjoy, what matters most, and any location/budget preferences). I’ll shortlist courses using official Discover Uni data.
                      </div>
                      <div class="msg-meta">UniGuide</div>
                    </div>
                  </div>

                  <div v-for="(m, idx) in uniguideChatMessages" :key="idx" class="msg" :class="m.role === 'user' ? 'user' : 'ai'">
                    <div class="msg-avatar" aria-hidden="true">{{ m.role === 'user' ? studentInitials : 'UG' }}</div>
                    <div>
                      <div class="msg-bubble">{{ m.content }}</div>
                      <div class="msg-meta">{{ m.role === 'user' ? 'You' : 'UniGuide' }}</div>
                    </div>
                  </div>

                  <div v-if="uniguideChatLoading" class="msg ai">
                    <div class="msg-avatar" aria-hidden="true">UG</div>
                    <div class="msg-bubble typing-indicator" aria-label="UniGuide is typing">
                      <div class="typing-dot"></div>
                      <div class="typing-dot"></div>
                      <div class="typing-dot"></div>
                    </div>
                  </div>
                </div>

                <div class="chat-options" aria-label="Quick prompts">
                  <button v-for="p in uniguideQuickPrompts" :key="p" type="button" class="option-chip" @click="useUniGuideQuickPrompt(p)">
                    {{ p }}
                  </button>
                </div>

                <div v-if="uniguideChatError" class="inline-error chat-error">{{ uniguideChatError }}</div>

                <div class="chat-input-row">
                  <textarea
                    v-model="uniguideChatInput"
                    class="chat-input"
                    rows="1"
                    placeholder="Ask UniGuide…"
                    :disabled="uniguideChatLoading"
                    @keydown.enter.exact.prevent="sendUniGuideChat"
                  ></textarea>
                  <button class="send-btn" type="button" @click="sendUniGuideChat" :disabled="uniguideChatLoading" aria-label="Send message">
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TAB: SEARCH ─────────────────────────────────────────────── -->
          <div class="tab-content" :class="{ active: offersEditorTab === 'search' }" role="tabpanel">
            <div class="search-layout">
              <div class="search-top">
                <div class="search-bar-row">
                  <div class="search-input-wrap">
                    <span class="search-icon" aria-hidden="true">🔍</span>
                    <input
                      v-model="uniguideQuery"
                      class="search-input"
                      type="text"
                      placeholder="Search e.g. Psychology, Computer Science, Criminology…"
                      @keydown.enter.prevent="runUniGuideSearch"
                    />
                  </div>
                  <button class="add-btn" type="button" @click="runUniGuideSearch" :disabled="uniguideLoading">
                    {{ uniguideLoading ? 'Searching…' : 'Search' }}
                  </button>
                </div>

                <div class="filters-row">
                  <label class="filter-chip" style="cursor:default;">
                    Subject code
                    <input v-model="uniguideSubjectCode" class="filter-input" type="text" placeholder="e.g. C8" />
                  </label>
                  <label class="filter-chip" style="cursor:default;">
                    Min tariff
                    <input v-model.number="uniguideMinTariff" class="filter-input" type="number" inputmode="numeric" placeholder="0" />
                  </label>
                  <label class="filter-chip" style="cursor:default;">
                    Max tariff
                    <input v-model.number="uniguideMaxTariff" class="filter-input" type="number" inputmode="numeric" placeholder="160" />
                  </label>
                </div>

                <div v-if="uniguideError" class="inline-error" style="margin-top:10px;">{{ uniguideError }}</div>
              </div>

              <div class="search-results" aria-label="UniGuide search results">
                <div class="results-meta">
                  <div class="results-count">
                    <span v-if="uniguideLoading">Searching…</span>
                    <span v-else-if="uniguideResults.length">{{ uniguideResults.length }} results</span>
                    <span v-else>Try a search to get started.</span>
                  </div>
                  <button class="offers-secondary" type="button" @click="offersEditorTab = 'manual'">
                    📋 View shortlist
                  </button>
                </div>

                <div v-for="r in uniguideResults" :key="r.course_key" class="course-card" :class="{ saved: isUniGuideCourseSaved(r) }">
                  <div class="uni-logo">{{ (r.institution_name || 'UNI').slice(0,3).toUpperCase() }}</div>
                  <div class="course-info">
                    <div class="course-name">{{ r.title || 'Course' }}</div>
                    <div class="uni-name">{{ r.institution_name || 'Institution' }}</div>
                    <div class="course-tags">
                      <span v-if="r.tariff_typical !== null && r.tariff_typical !== undefined" class="tag tariff">Tariff {{ r.tariff_typical }}</span>
                      <span v-if="r.tef_overall_rating" class="tag">TEF {{ r.tef_overall_rating }}</span>
                    </div>
                    <div class="course-tags" style="margin-top:10px;">
                      <a v-if="r.course_url" class="save-btn" :href="r.course_url" target="_blank" rel="noopener noreferrer">🔗 Course</a>
                      <button class="save-btn" type="button" :class="{ saved: isUniGuideCourseSaved(r) }" @click="addUniGuideCourseToDraft(r)">
                        {{ isUniGuideCourseSaved(r) ? 'Saved' : 'Save' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TAB: MANUAL SHORTLIST ───────────────────────────────────── -->
          <div class="tab-content" :class="{ active: offersEditorTab === 'manual' }" role="tabpanel">
            <div class="manual-layout">
              <div class="shortlist-header">
                <div>
                  <div class="shortlist-title">My Shortlist</div>
                  <div class="shortlist-subtitle">Add up to 5 choices. Your #1 ranked choice is shown on the profile.</div>
                </div>
                <button class="add-btn" type="button" @click="addOfferRow" :disabled="offersDraft.length >= 5">
                  ➕ Add choice
                </button>
              </div>

              <div class="shortlist-cards">
                <template v-for="rank in [1,2,3,4,5]" :key="rank">
                  <div
                    v-if="getDraftRowForRank(rank)"
                    class="shortlist-card"
                    :class="{ 'first-choice': rank === 1 }"
                  >
                    <div class="choice-number">{{ rank }}</div>
                    <div class="shortlist-info">
                      <div class="shortlist-course">{{ getDraftRowForRank(rank).courseTitle || 'Course (add details)' }}</div>
                      <div class="shortlist-uni">{{ getDraftRowForRank(rank).universityName || 'University' }}</div>
                      <div class="shortlist-tags">
                        <span v-if="getDraftRowForRank(rank).offer" class="status-badge offer">Offer {{ getDraftRowForRank(rank).offer }}</span>
                        <span v-if="getDraftRowForRank(rank).ucasPoints" class="status-badge applied">UCAS {{ getDraftRowForRank(rank).ucasPoints }}</span>
                        <a
                          v-if="safeCourseLink(getDraftRowForRank(rank).courseLink)"
                          class="status-badge watching"
                          :href="safeCourseLink(getDraftRowForRank(rank).courseLink)"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🔗 Link
                        </a>
                      </div>

                      <div v-if="uniguideManualEditRank === rank" class="shortlist-edit">
                        <div class="edit-grid">
                          <label class="edit-field">
                            <span>University</span>
                            <input v-model="getDraftRowForRank(rank).universityName" type="text" />
                          </label>
                          <label class="edit-field">
                            <span>Course</span>
                            <input v-model="getDraftRowForRank(rank).courseTitle" type="text" />
                          </label>
                          <label class="edit-field">
                            <span>Course link</span>
                            <input v-model="getDraftRowForRank(rank).courseLink" type="text" placeholder="https://…" />
                          </label>
                          <label class="edit-field">
                            <span>Offer</span>
                            <input v-model="getDraftRowForRank(rank).offer" type="text" placeholder="e.g. AAB" />
                          </label>
                          <label class="edit-field">
                            <span>UCAS points</span>
                            <input v-model="getDraftRowForRank(rank).ucasPoints" type="text" inputmode="numeric" placeholder="e.g. 128" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div class="shortlist-actions">
                      <button class="icon-btn" type="button" @click="toggleManualEdit(rank)" :title="uniguideManualEditRank === rank ? 'Close edit' : 'Edit details'">✏️</button>
                      <button class="icon-btn danger" type="button" @click="removeDraftRank(rank)" title="Remove">🗑️</button>
                    </div>
                  </div>

                  <div v-else class="empty-slot" role="button" tabindex="0" @click="createDraftRank(rank)" @keydown.enter.prevent="createDraftRank(rank)">
                    <div class="slot-num">{{ rank }}</div>
                    <div>
                      <div style="font-weight:700;">Add choice {{ rank }}</div>
                      <div style="font-size:12px; opacity:0.85;">Click to add a course, then save.</div>
                    </div>
              </div>
            </template>
          </div>

              <div class="ucas-summary">
                <div class="ucas-text">
                  <strong>Ready to write your UCAS application?</strong>
                  <span>{{ nonEmptyOffersDraftCount }} choices in draft</span>
                </div>
                <button class="ucas-btn" type="button" @click="openUcasApplication" :disabled="nonEmptyOffersDraftCount === 0">
                  📝 UCAS Application
            </button>
          </div>
        </div>
          </div>
        </div>

        <!-- Preferences modal (forced on first use) -->
        <div v-if="uniguidePrefsOpen" class="prefs-modal-overlay" @click.self="closeUniGuidePrefs">
          <div class="prefs-modal" role="dialog" aria-modal="true" aria-label="UniGuide preferences">
            <div class="prefs-modal-top">
              <div>
                <div class="prefs-title">My university preferences</div>
                <div class="prefs-subtitle">
                  This helps UniGuide personalise your AI conversation and course results. You can update it any time during the year.
                </div>
              </div>
              <button v-if="!uniguidePrefsRequired" class="close-btn" type="button" @click="closeUniGuidePrefs" aria-label="Close preferences">×</button>
            </div>

            <div class="prefs-progress" role="navigation" aria-label="Preferences steps">
              <button v-for="s in prefsSteps" :key="s.n" class="prefs-step" :class="{ active: uniguidePrefsStep === s.n, done: uniguidePrefsStep > s.n }" type="button" @click="goPrefsStep(s.n)">
                <span class="prefs-dot">{{ s.n }}</span>
                <span class="prefs-name">{{ s.label }}</span>
              </button>
            </div>

            <div class="prefs-body">
              <div v-if="uniguidePrefsStep === 1" class="prefs-panel">
                <div class="prefs-eyebrow">STEP {{ uniguidePrefsStep }} OF 5</div>
                <div class="prefs-panel-title">What genuinely interests you?</div>
                <div class="prefs-panel-desc">Select everything that feels true.</div>
                <div class="prefs-card-grid cols-3">
                  <button v-for="opt in prefsInterests" :key="opt.val" type="button" class="prefs-card" :class="{ selected: (uniguideIntake.interests||[]).includes(opt.val) }" @click="togglePrefsMulti('interests', opt.val)">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <label class="prefs-label">Beyond school (optional)</label>
                <textarea v-model="uniguideIntake.passion_text" class="prefs-textarea" rows="3" placeholder="e.g. volunteering, hobbies, topics you love…"></textarea>
              </div>

              <div v-else-if="uniguidePrefsStep === 2" class="prefs-panel">
                <div class="prefs-eyebrow">STEP {{ uniguidePrefsStep }} OF 5</div>
                <div class="prefs-panel-title">Career direction</div>
                <div class="prefs-panel-desc">No pressure — being honest helps UniGuide suggest the right kind of course.</div>
                <div class="prefs-card-grid cols-3">
                  <button v-for="opt in prefsCareerClarity" :key="opt.val" type="button" class="prefs-card" :class="{ selected: uniguideIntake.career_clarity === opt.val }" @click="uniguideIntake.career_clarity = opt.val">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <div class="prefs-divider"></div>
                <div class="prefs-small-title">Sectors that interest you</div>
                <div class="prefs-card-grid cols-4">
                  <button v-for="opt in prefsCareerSectors" :key="opt.val" type="button" class="prefs-card compact" :class="{ selected: (uniguideIntake.career_sectors||[]).includes(opt.val) }" @click="togglePrefsMulti('career_sectors', opt.val)">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                  </button>
                </div>
                <label class="prefs-label">Postgraduate routes (optional)</label>
                <input v-model="uniguideIntake.postgrad_plans" class="prefs-input" type="text" placeholder="e.g. medicine, law conversion, teacher training…" />
              </div>

              <div v-else-if="uniguidePrefsStep === 3" class="prefs-panel">
                <div class="prefs-eyebrow">STEP {{ uniguidePrefsStep }} OF 5</div>
                <div class="prefs-panel-title">University life</div>
                <div class="prefs-panel-desc">The right environment matters as much as the right course.</div>
                <div class="prefs-grid-2">
                  <div>
                    <div class="prefs-small-title">City or campus?</div>
                    <div class="prefs-card-grid cols-3">
                      <button v-for="opt in prefsCampusType" :key="opt.val" type="button" class="prefs-card compact" :class="{ selected: uniguideIntake.campus_type === opt.val }" @click="uniguideIntake.campus_type = opt.val">
                        <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                        <div class="prefs-card-title">{{ opt.title }}</div>
                      </button>
                    </div>
                  </div>
                  <div>
                    <div class="prefs-small-title">University size</div>
                    <div class="prefs-card-grid cols-3">
                      <button v-for="opt in prefsUniSize" :key="opt.val" type="button" class="prefs-card compact" :class="{ selected: uniguideIntake.uni_size === opt.val }" @click="uniguideIntake.uni_size = opt.val">
                        <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                        <div class="prefs-card-title">{{ opt.title }}</div>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="prefs-small-title">Distance from home</div>
                <div class="prefs-card-grid cols-2">
                  <button v-for="opt in prefsDistance" :key="opt.val" type="button" class="prefs-card" :class="{ selected: uniguideIntake.distance === opt.val }" @click="uniguideIntake.distance = opt.val">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <div class="prefs-small-title">Social priorities</div>
                <div class="prefs-card-grid cols-4">
                  <button v-for="opt in prefsSocial" :key="opt.val" type="button" class="prefs-card compact" :class="{ selected: (uniguideIntake.social_priorities||[]).includes(opt.val) }" @click="togglePrefsMulti('social_priorities', opt.val)">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                  </button>
                </div>
              </div>

              <div v-else-if="uniguidePrefsStep === 4" class="prefs-panel">
                <div class="prefs-eyebrow">STEP {{ uniguidePrefsStep }} OF 5</div>
                <div class="prefs-panel-title">Practicalities</div>
                <div class="prefs-panel-desc">There are no wrong answers — this stays private and helps UniGuide be realistic.</div>
                <div class="prefs-small-title">Debt attitude</div>
                <div class="prefs-card-grid cols-3">
                  <button v-for="opt in prefsDebt" :key="opt.val" type="button" class="prefs-card" :class="{ selected: uniguideIntake.debt_attitude === opt.val }" @click="uniguideIntake.debt_attitude = opt.val">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <div class="prefs-grid-2">
                  <div>
                    <div class="prefs-small-title">Accommodation</div>
                    <div class="prefs-chip-row">
                      <button v-for="opt in prefsAccommodation" :key="opt.val" type="button" class="prefs-chip" :class="{ selected: uniguideIntake.accommodation === opt.val }" @click="uniguideIntake.accommodation = opt.val">{{ opt.label }}</button>
                    </div>
                  </div>
                  <div>
                    <div class="prefs-small-title">Part-time work</div>
                    <div class="prefs-chip-row">
                      <button v-for="opt in prefsWork" :key="opt.val" type="button" class="prefs-chip" :class="{ selected: uniguideIntake.part_time_work === opt.val }" @click="uniguideIntake.part_time_work = opt.val">{{ opt.label }}</button>
                    </div>
                  </div>
                </div>
                <div class="prefs-small-title">Context (optional)</div>
                <div class="prefs-card-grid cols-2">
                  <button v-for="opt in prefsContextFlags" :key="opt.val" type="button" class="prefs-card" :class="{ selected: (uniguideIntake.context_flags||[]).includes(opt.val) }" @click="togglePrefsMulti('context_flags', opt.val)">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
              </div>

              <div v-else class="prefs-panel">
                <div class="prefs-eyebrow">STEP {{ uniguidePrefsStep }} OF 5</div>
                <div class="prefs-panel-title">Study style</div>
                <div class="prefs-panel-desc">Different universities have very different teaching cultures.</div>
                <div class="prefs-small-title">Learning style</div>
                <div class="prefs-card-grid cols-2">
                  <button v-for="opt in prefsLearning" :key="opt.val" type="button" class="prefs-card" :class="{ selected: uniguideIntake.learning_style === opt.val }" @click="uniguideIntake.learning_style = opt.val">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <div class="prefs-small-title">Assessment preference</div>
                <div class="prefs-chip-row">
                  <button v-for="opt in prefsAssessment" :key="opt.val" type="button" class="prefs-chip" :class="{ selected: uniguideIntake.assessment_pref === opt.val }" @click="uniguideIntake.assessment_pref = opt.val">{{ opt.label }}</button>
                </div>
                <div class="prefs-small-title">Course features</div>
                <div class="prefs-card-grid cols-3">
                  <button v-for="opt in prefsCourseFeatures" :key="opt.val" type="button" class="prefs-card compact" :class="{ selected: (uniguideIntake.course_features||[]).includes(opt.val) }" @click="togglePrefsMulti('course_features', opt.val)">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <div class="prefs-small-title">Aspiration level</div>
                <div class="prefs-card-grid cols-3">
                  <button v-for="opt in prefsAspiration" :key="opt.val" type="button" class="prefs-card" :class="{ selected: uniguideIntake.aspiration_level === opt.val }" @click="uniguideIntake.aspiration_level = opt.val">
                    <div class="prefs-ico" aria-hidden="true">{{ opt.ico }}</div>
                    <div class="prefs-card-title">{{ opt.title }}</div>
                    <div class="prefs-card-sub">{{ opt.sub }}</div>
                  </button>
                </div>
                <label class="prefs-label">Anything else the AI should know? (optional)</label>
                <textarea v-model="uniguideIntake.additional_notes" class="prefs-textarea" rows="3" placeholder="e.g. joint honours ideas, wellbeing support, specific needs…"></textarea>
              </div>
            </div>

            <div class="prefs-nav">
              <button class="offers-secondary" type="button" :disabled="uniguidePrefsStep === 1" @click="goPrefsStep(uniguidePrefsStep - 1)">← Back</button>
              <div class="prefs-nav-mid">{{ uniguidePrefsStep }} / 5</div>
              <button v-if="uniguidePrefsStep < 5" class="offers-primary" type="button" @click="goPrefsStep(uniguidePrefsStep + 1)">Continue →</button>
              <button v-else class="offers-primary" type="button" @click="completePrefsAndSave" :disabled="uniguideProfileSaving">
                {{ uniguideProfileSaving ? 'Saving…' : (uniguidePrefsRequired ? 'Save & continue ✓' : 'Save preferences ✓') }}
              </button>
            </div>
            <div v-if="uniguidePrefsRequired" class="prefs-required-hint">Complete this once to start using UniGuide.</div>
          </div>
        </div>

        <div class="offers-modal-footer">
          <button class="offers-secondary" type="button" @click="closeOffersEditor">Cancel</button>
          <button class="offers-primary" type="button" @click="saveOffers" :disabled="offersSaving">
            {{ offersSaving ? 'Saving…' : 'Save choices' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SubjectCard from './SubjectCard.vue'
import SubjectCardKs4 from './SubjectCardKs4.vue'
import InfoModal from './InfoModal.vue'
import UcasApplicationModal from './UcasApplicationModal.vue'
import { updateSubjectGrade, updateUniversityOffers, uniguideSearchCourses, uniguideGetProfile, uniguideSaveProfile, uniguideChat } from '../services/api.js'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  subjects: {
    type: Array,
    default: () => []
  },
  updatedAt: {
    type: String,
    default: null
  },
  academicYear: {
    type: String,
    default: null
  },
  editable: {
    type: Boolean,
    default: false
  },
  offersEditable: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'inline' // 'inline' or 'modal'
  },
  dataSource: {
    type: String,
    default: 'unknown'
  },
  // School-wide defaults (primarily for STUDENTS; students do not get MEG/STG toggles)
  uiDefaults: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['reload'])

// State
const isEditMode = ref(false)
const showInfoModal = ref(false)
const saving = ref(false)
const pendingChanges = ref({}) // Track changes before save
const showMeg = ref(false)
const showStg = ref(false)
const userOverrodeVisibility = ref(false)
const showPredicted = ref(false)

// University Offers state
const offersExpanded = ref(false)
const offersEditorOpen = ref(false)
const offersSaving = ref(false)
const offersDraft = ref([])
const offersEditorTab = ref('ai') // 'ai' | 'search' | 'manual'

// UniGuide search state (Discover Uni dataset)
const uniguideQuery = ref('')
const uniguideSubjectCode = ref('')
const uniguideMinTariff = ref(null)
const uniguideMaxTariff = ref(null)
const uniguideLoading = ref(false)
const uniguideError = ref('')
const uniguideResults = ref([])

// UniGuide intake + AI chat state
const uniguideProfileLoading = ref(false)
const uniguideProfileSaving = ref(false)
const uniguideProfileError = ref('')
const uniguideIntake = ref({
  interests: [],
  passion_text: '',
  career_clarity: 'exploring',
  career_sectors: [],
  postgrad_plans: '',
  campus_type: '',
  uni_size: '',
  distance: '',
  social_priorities: [],
  debt_attitude: 'unconcerned',
  accommodation: 'halls',
  part_time_work: 'no',
  context_flags: [],
  learning_style: '',
  assessment_pref: 'mixed',
  course_features: [],
  aspiration_level: 'balanced',
  additional_notes: '',
  priorities: [] // legacy quick chips (still supported)
})

const uniguideSessionId = ref(null)
const uniguideChatInput = ref('')
const uniguideChatLoading = ref(false)
const uniguideChatError = ref('')
const uniguideChatMessages = ref([]) // {role:'user'|'assistant', content:string}
const uniguideSuggestions = ref([])  // {course_key,title,institution_name,course_url,band,reason_short,tariff_typical,tef_overall_rating}
const uniguideChatScrollEl = ref(null)

const uniguideQuickPrompts = [
  "I enjoy Psychology and Sociology — what courses fit?",
  "I want a friendly city and good student experience",
  "I’d like to stay in the North and keep costs down"
]

const uniguideStudentEmail = computed(() => (props.student?.email || '').toString().trim().toLowerCase())
const uniguideAcademicYear = computed(() => (props.academicYear || 'current').toString().trim() || 'current')

const intakeLooksEmpty = computed(() => {
  const i = uniguideIntake.value || {}
  const hasAnyArray = Array.isArray(i.interests) && i.interests.length
  const hasAnyText = ['passion_text', 'postgrad_plans', 'additional_notes'].some(k => String(i[k] || '').trim())
  return !(hasAnyArray || hasAnyText)
})

const uniguidePrefsStep = ref(1)
const prefsSteps = [
  { n: 1, label: 'Interests' },
  { n: 2, label: 'Career' },
  { n: 3, label: 'University life' },
  { n: 4, label: 'Practicalities' },
  { n: 5, label: 'Study style' }
]

const uniguidePrefsCompleted = computed(() => Boolean((uniguideIntake.value || {}).preferences_completed))
const uniguidePrefsOpen = ref(false)
const uniguidePrefsRequired = computed(() => Boolean(
  offersEditorOpen.value &&
  !uniguidePrefsCompleted.value &&
  !String(uniguideProfileError.value || '').trim()
))

const openUniGuidePrefs = () => {
  uniguidePrefsOpen.value = true
  if (!uniguidePrefsStep.value) uniguidePrefsStep.value = 1
}

const closeUniGuidePrefs = () => {
  if (uniguidePrefsRequired.value) return
  uniguidePrefsOpen.value = false
}

const goPrefsStep = (n) => {
  const nn = Math.max(1, Math.min(5, Number(n) || 1))
  uniguidePrefsStep.value = nn
  try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (_) {}
}

const resetUniGuidePrefs = () => {
  uniguideIntake.value = {
    ...uniguideIntake.value,
    interests: [],
    passion_text: '',
    career_clarity: 'exploring',
    career_sectors: [],
    postgrad_plans: '',
    campus_type: '',
    uni_size: '',
    distance: '',
    social_priorities: [],
    debt_attitude: 'unconcerned',
    accommodation: 'halls',
    part_time_work: 'no',
    context_flags: [],
    learning_style: '',
    assessment_pref: 'mixed',
    course_features: [],
    aspiration_level: 'balanced',
    additional_notes: '',
    preferences_completed: false
  }
  uniguidePrefsStep.value = 1
}

const togglePrefsMulti = (field, value) => {
  const intake = uniguideIntake.value || {}
  const arr = Array.isArray(intake[field]) ? [...intake[field]] : []
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  uniguideIntake.value = { ...intake, [field]: arr }
}

const completePrefsAndSave = async () => {
  uniguideIntake.value = { ...(uniguideIntake.value || {}), preferences_completed: true }
  await saveUniGuideProfile()
  offersEditorTab.value = 'ai'
  uniguidePrefsOpen.value = false

  // Immediately start the conversation so the preferences feel "used"
  if ((uniguideChatMessages.value || []).length === 0) {
    try {
      await startUniGuideChat()
    } catch (_) {}
  }
}

const prefsInterests = [
  { val: 'people-behaviour', ico: '🧠', title: 'People & behaviour', sub: 'Why people think, feel, and act the way they do' },
  { val: 'science-medicine', ico: '🔬', title: 'Science & medicine', sub: 'Biology, health, research, discovery' },
  { val: 'society-justice', ico: '⚖️', title: 'Society & justice', sub: 'Law, politics, inequality, change' },
  { val: 'technology-digital', ico: '💻', title: 'Technology & digital', sub: 'Computing, AI, engineering, systems' },
  { val: 'business-enterprise', ico: '📈', title: 'Business & enterprise', sub: 'Organisations, economics, entrepreneurship' },
  { val: 'arts-creative', ico: '🎨', title: 'Arts & creative', sub: 'Design, music, film, writing, performance' },
  { val: 'environment-nature', ico: '🌍', title: 'Environment & nature', sub: 'Climate, ecology, sustainability' },
  { val: 'history-culture', ico: '🏛️', title: 'History & culture', sub: 'The past, languages, global perspectives' },
  { val: 'maths-logic', ico: '∑', title: 'Maths & logic', sub: 'Patterns, proofs, abstract thinking' }
]

const prefsCareerClarity = [
  { val: 'exploring', ico: '🔭', title: 'Exploring', sub: "I genuinely don't know yet — I want to discover" },
  { val: 'leaning', ico: '🧭', title: 'Leaning', sub: "I have a rough direction but it's not fixed" },
  { val: 'focused', ico: '🎯', title: 'Focused', sub: 'I have a specific career or field in mind' }
]

const prefsCareerSectors = [
  { val: 'healthcare', ico: '🏥', title: 'Healthcare' },
  { val: 'education', ico: '📚', title: 'Education' },
  { val: 'law', ico: '⚖️', title: 'Law' },
  { val: 'tech', ico: '💻', title: 'Tech' },
  { val: 'finance', ico: '💹', title: 'Finance' },
  { val: 'media-creative', ico: '🎬', title: 'Media' },
  { val: 'environment', ico: '🌿', title: 'Environment' },
  { val: 'public-sector', ico: '🏛️', title: 'Public sector' },
  { val: 'research', ico: '🔬', title: 'Research' },
  { val: 'sport-health', ico: '⚽', title: 'Sport' },
  { val: 'social-work', ico: '🤝', title: 'Social work' },
  { val: 'unsure', ico: '🤷', title: 'Not sure yet' }
]

const prefsCampusType = [
  { val: 'city', ico: '🌆', title: 'City' },
  { val: 'campus', ico: '🏫', title: 'Campus' },
  { val: 'no_preference', ico: '🤷', title: 'No preference' }
]

const prefsUniSize = [
  { val: 'small', ico: '🏡', title: 'Small' },
  { val: 'medium', ico: '🏢', title: 'Medium' },
  { val: 'large', ico: '🏙️', title: 'Large' }
]

const prefsDistance = [
  { val: 'local', ico: '🏠', title: 'Close to home', sub: 'Within an hour — easy to get back' },
  { val: 'regional', ico: '🚆', title: 'Same region', sub: 'Happy to be 1–2 hours away' },
  { val: 'uk_wide', ico: '🗺️', title: 'Anywhere in the UK', sub: 'Best course wins — travel is fine' },
  { val: 'international', ico: '✈️', title: 'Open to abroad', sub: 'Would consider international study' }
]

const prefsSocial = [
  { val: 'sports', ico: '⚽', title: 'Sports' },
  { val: 'societies', ico: '🎭', title: 'Societies' },
  { val: 'nightlife', ico: '🎉', title: 'Social life' },
  { val: 'volunteering', ico: '🤝', title: 'Volunteering' },
  { val: 'research-culture', ico: '🔭', title: 'Research culture' },
  { val: 'employability', ico: '💼', title: 'Employability' },
  { val: 'diversity', ico: '🌍', title: 'Diversity' },
  { val: 'wellbeing', ico: '💚', title: 'Wellbeing support' }
]

const prefsDebt = [
  { val: 'unconcerned', ico: '😌', title: 'Unconcerned', sub: "It's an investment — I'm not worried" },
  { val: 'mindful', ico: '🤔', title: 'Mindful', sub: "I want to be sensible about costs" },
  { val: 'concerned', ico: '😟', title: 'Concerned', sub: 'Cost is a real factor in my decisions' }
]

const prefsAccommodation = [
  { val: 'halls', label: 'University halls' },
  { val: 'private', label: 'Private rented' },
  { val: 'home', label: 'Living at home' },
  { val: 'flexible', label: 'Flexible / not sure' }
]

const prefsWork = [
  { val: 'yes_needed', label: 'Yes — financially needed' },
  { val: 'yes_optional', label: 'Yes — to stay busy' },
  { val: 'maybe', label: 'Maybe' },
  { val: 'no', label: 'No — focus on studies' }
]

const prefsContextFlags = [
  { val: 'first_gen', ico: '🌟', title: 'First in family', sub: "I'd benefit from extra guidance and context" },
  { val: 'gap_year', ico: '🌏', title: 'Considering a gap year', sub: 'I might defer entry or take time before starting' },
  { val: 'disability_support', ico: '♿', title: 'Disability / additional needs', sub: 'Student support services matter to my choice' },
  { val: 'care_responsibilities', ico: '🏠', title: 'Care/family responsibilities', sub: 'I need flexibility around commitments at home' }
]

const prefsLearning = [
  { val: 'lectures', ico: '🎤', title: 'Large lectures', sub: 'Absorb, take notes, work independently' },
  { val: 'seminars', ico: '💬', title: 'Small seminars', sub: 'Discussion, debate, small groups' },
  { val: 'practical', ico: '🔬', title: 'Practical & lab-based', sub: 'Do, make, build — not just listen' },
  { val: 'mixed', ico: '🔀', title: 'Mix of everything', sub: 'Variety keeps me engaged' }
]

const prefsAssessment = [
  { val: 'exams', label: 'Mainly exams' },
  { val: 'coursework', label: 'Mainly coursework' },
  { val: 'mixed', label: 'Mix of both' },
  { val: 'no_preference', label: 'No preference' }
]

const prefsCourseFeatures = [
  { val: 'placement_year', ico: '💼', title: 'Placement year', sub: 'Work in industry before final year' },
  { val: 'year_abroad', ico: '✈️', title: 'Year abroad', sub: 'Study at an international partner' },
  { val: 'integrated_masters', ico: '🎓', title: 'Integrated Masters', sub: '4-year programme ending in MSc/MEng' },
  { val: 'research_project', ico: '🔭', title: 'Research project', sub: 'Dissertation or independent research' },
  { val: 'clinical_experience', ico: '🏥', title: 'Clinical placements', sub: 'Hands-on practice experience' },
  { val: 'accreditation', ico: '📜', title: 'Accreditation', sub: 'Course accredited by a professional body' }
]

const prefsAspiration = [
  { val: 'stretch', ico: '🚀', title: 'Stretch', sub: 'Most prestigious I can realistically get' },
  { val: 'balanced', ico: '⚖️', title: 'Balanced', sub: 'Mix of ambitious and realistic options' },
  { val: 'safe', ico: '🛡️', title: 'Safe', sub: "I want to feel confident I'll get in" }
]

const uniguideSubjectsSummary = computed(() => {
  const rows = Array.isArray(props.subjects) ? props.subjects : []
  const names = rows
    .map(s => (s?.name || s?.subject || s?.subjectName || s?.title || '').toString().trim())
    .filter(Boolean)
  if (!names.length) return `${rows.length || 0} subjects`
  return names.slice(0, 4).join(', ') + (names.length > 4 ? '…' : '')
})

const uniguidePhaseIndex = computed(() => {
  // Lightweight heuristic: move through phases as conversation grows.
  const n = (uniguideChatMessages.value || []).length
  if (n <= 1) return 0
  if (n <= 3) return 1
  if (n <= 5) return 2
  if (n <= 7) return 3
  return 4
})

const useUniGuideQuickPrompt = async (text) => {
  const t = (text || '').toString().trim()
  if (!t) return
  uniguideChatInput.value = t
  await sendUniGuideChat()
}

const isUniGuideCourseSaved = (r) => {
  if (!r) return false
  const uniFinal = (r.institution_name || r.institutionName || r.universityName || '').toString().trim().toLowerCase()
  const titleFinal = (r.title || r.courseTitle || r.course_title || '').toString().trim().toLowerCase()
  const urlRaw = r.course_url || r.courseUrl || r.course_link || r.courseLink || ''
  const link = safeCourseLink(urlRaw) || (urlRaw || '').toString().trim()

  return (offersDraft.value || []).some(row => {
    const sameLink = link && safeCourseLink(row.courseLink) === link
    const sameText = uniFinal && titleFinal &&
      (String(row.universityName || '').trim().toLowerCase() === uniFinal) &&
      (String(row.courseTitle || '').trim().toLowerCase() === titleFinal)
    return sameLink || sameText
  })
}

const uniguideManualEditRank = ref(null)

const getDraftRowForRank = (rank) => {
  const r = Number(rank)
  return (offersDraft.value || []).find(x => Number(x?.ranking) === r) || null
}

const createDraftRank = (rank) => {
  const r = Number(rank)
  if (!(r >= 1 && r <= 5)) return
  if (getDraftRowForRank(r)) {
    uniguideManualEditRank.value = r
    return
  }
  if ((offersDraft.value || []).length >= 5) {
    showTemporaryMessage('You can only save up to 5 choices.', 'error')
    return
  }
  offersDraft.value = [
    ...(offersDraft.value || []),
    {
      _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      universityName: '',
      courseTitle: '',
      courseLink: '',
      offer: '',
      ucasPoints: '',
      ranking: r
    }
  ]
  uniguideManualEditRank.value = r
}

const removeDraftRank = (rank) => {
  const r = Number(rank)
  offersDraft.value = (offersDraft.value || []).filter(x => Number(x?.ranking) !== r)
  if (uniguideManualEditRank.value === r) uniguideManualEditRank.value = null
}

const toggleManualEdit = (rank) => {
  const r = Number(rank)
  uniguideManualEditRank.value = (uniguideManualEditRank.value === r) ? null : r
}

const loadUniGuideProfile = async () => {
  const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
  if (!apiUrl) return
  if (!uniguideStudentEmail.value) return

  uniguideProfileLoading.value = true
  uniguideProfileError.value = ''
  try {
    const resp = await uniguideGetProfile({
      studentEmail: uniguideStudentEmail.value,
      academicYear: uniguideAcademicYear.value
    }, apiUrl)

    if (!resp || !resp.success) throw new Error(resp?.error || 'Failed to load profile')
    const intake = resp.intake || resp.data?.intake || {}
    if (intake && typeof intake === 'object') {
      uniguideIntake.value = { ...uniguideIntake.value, ...intake }
    }
  } catch (e) {
    console.error('[UniGuide] load profile error:', e)
    uniguideProfileError.value = e?.message || 'Failed to load intake'
  } finally {
    uniguideProfileLoading.value = false
  }
}

const saveUniGuideProfile = async () => {
  const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
  if (!apiUrl) return
  if (!uniguideStudentEmail.value) return

  uniguideProfileSaving.value = true
  uniguideProfileError.value = ''
  try {
    const resp = await uniguideSaveProfile({
      studentEmail: uniguideStudentEmail.value,
      academicYear: uniguideAcademicYear.value,
      intake: uniguideIntake.value || {}
    }, apiUrl)
    if (!resp || !resp.success) throw new Error(resp?.error || 'Failed to save intake')
    showTemporaryMessage('UniGuide preferences saved.', 'success')
  } catch (e) {
    console.error('[UniGuide] save profile error:', e)
    showTemporaryMessage(e?.message || 'Failed to save UniGuide preferences', 'error')
  } finally {
    uniguideProfileSaving.value = false
  }
}

const startUniGuideChat = async () => {
  const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
  if (!apiUrl) return
  if (!uniguideStudentEmail.value) return

  // Reset any previous session state
  uniguideSessionId.value = null
  uniguideChatMessages.value = []
  uniguideSuggestions.value = []
  uniguideChatLoading.value = true
  uniguideChatError.value = ''
  try {
    const resp = await uniguideChat({
      studentEmail: uniguideStudentEmail.value,
      academicYear: uniguideAcademicYear.value,
      sessionId: null,
      message: '',
      datasetReleaseId: null,
      startChat: true
    }, apiUrl)
    if (!resp || !resp.success) throw new Error(resp?.error || 'Chat failed')

    uniguideSessionId.value = resp.session_id || null
    if (resp.assistant_message) {
      uniguideChatMessages.value = [{ role: 'assistant', content: resp.assistant_message }]
    }
    if (Array.isArray(resp.suggestions)) {
      uniguideSuggestions.value = resp.suggestions.map(s => ({ ...(s || {}) }))
    }
  } catch (e) {
    console.error('[UniGuide] start chat error:', e)
    uniguideChatError.value = e?.message || 'Chat failed'
  } finally {
    uniguideChatLoading.value = false
  }
}

const sendUniGuideChat = async () => {
  const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
  if (!apiUrl) return
  const text = (uniguideChatInput.value || '').toString().trim()
  if (!text) return
  if (uniguidePrefsRequired.value) {
    openUniGuidePrefs()
    uniguideChatError.value = 'Please complete your preferences first.'
    return
  }

  uniguideChatLoading.value = true
  uniguideChatError.value = ''
  uniguideChatMessages.value = [...uniguideChatMessages.value, { role: 'user', content: text }]
  uniguideChatInput.value = ''
  try {
    const resp = await uniguideChat({
      studentEmail: uniguideStudentEmail.value,
      academicYear: uniguideAcademicYear.value,
      sessionId: uniguideSessionId.value,
      message: text,
      datasetReleaseId: null
    }, apiUrl)
    if (!resp || !resp.success) throw new Error(resp?.error || 'Chat failed')

    if (resp.session_id) uniguideSessionId.value = resp.session_id
    if (resp.assistant_message) {
      uniguideChatMessages.value = [...uniguideChatMessages.value, { role: 'assistant', content: resp.assistant_message }]
    }
    if (Array.isArray(resp.suggestions)) {
      // merge new suggestions into right panel
      const merged = [...uniguideSuggestions.value]
      for (const s of resp.suggestions) {
        if (!s) continue
        const key = s.course_key || s.courseKey
        if (!key) continue
        if (merged.some(x => x && x.course_key === key)) continue
        merged.push({ course_key: key, ...s })
      }
      uniguideSuggestions.value = merged
    }
  } catch (e) {
    console.error('[UniGuide] chat error:', e)
    uniguideChatError.value = e?.message || 'Chat failed'
  } finally {
    uniguideChatLoading.value = false
  }
}

watch(
  () => uniguideChatMessages.value.length,
  async () => {
    await nextTick()
    const el = uniguideChatScrollEl.value
    if (el && typeof el.scrollTop === 'number') {
      el.scrollTop = el.scrollHeight
    }
  }
)

const nonEmptyOffersDraftCount = computed(() => {
  const rows = offersDraft.value || []
  return rows.filter(r =>
    (r && (
      String(r.universityName || '').trim() ||
      String(r.courseTitle || '').trim() ||
      String(r.courseLink || '').trim() ||
      String(r.offer || '').trim() ||
      String(r.ucasPoints || '').trim()
    ))
  ).length
})

const runUniGuideSearch = async () => {
  const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
  if (!apiUrl) {
    uniguideError.value = 'UniGuide search is not configured (missing apiUrl).'
    return
  }

  uniguideLoading.value = true
  uniguideError.value = ''
  try {
    const resp = await uniguideSearchCourses({
      q: (uniguideQuery.value || '').trim(),
      subjectCode: (uniguideSubjectCode.value || '').trim() || null,
      minTariff: Number.isFinite(uniguideMinTariff.value) ? uniguideMinTariff.value : null,
      maxTariff: Number.isFinite(uniguideMaxTariff.value) ? uniguideMaxTariff.value : null,
      limit: 20,
      offset: 0,
      datasetReleaseId: null
    }, apiUrl)

    if (!resp || !resp.success) throw new Error(resp?.error || 'Search failed')

    const rows = Array.isArray(resp.data) ? resp.data : []
    uniguideResults.value = rows
  } catch (e) {
    console.error('[UniGuide] search error:', e)
    uniguideResults.value = []
    uniguideError.value = e?.message || 'Failed to search'
  } finally {
    uniguideLoading.value = false
  }
}

const addUniGuideCourseToDraft = (r) => {
  if (!r) return

  const uniFinal = (r.institution_name || r.institutionName || r.universityName || '').toString().trim()
  const titleFinal = (r.title || r.courseTitle || r.course_title || '').toString().trim()
  const urlRaw = r.course_url || r.courseUrl || r.course_link || r.courseLink || ''
  const link = safeCourseLink(urlRaw) || (urlRaw || '').toString().trim()

  const existing = (offersDraft.value || []).some(row => {
    const sameLink = link && safeCourseLink(row.courseLink) === link
    const sameText = uniFinal && titleFinal && (String(row.universityName || '').trim().toLowerCase() === uniFinal.toLowerCase()) &&
      (String(row.courseTitle || '').trim().toLowerCase() === titleFinal.toLowerCase())
    return sameLink || sameText
  })

  if (existing) {
    showTemporaryMessage('That course is already in your choices.', 'error')
    return
  }

  // Fill an existing empty row first (better UX), otherwise add a new one if we can.
  const rows = offersDraft.value || []
  const isRowEmpty = (row) => {
    if (!row) return true
    return !String(row.universityName || '').trim()
      && !String(row.courseTitle || '').trim()
      && !String(row.courseLink || '').trim()
      && !String(row.offer || '').trim()
      && !String(row.ucasPoints || '').trim()
  }

  let targetRow = rows.find(isRowEmpty) || null

  if (!targetRow) {
    if (rows.length >= 5) {
      showTemporaryMessage('You can only save up to 5 choices.', 'error')
      return
    }
    // Pick next available rank
    const used = new Set(rows.map(x => Number(x.ranking)).filter(Boolean))
    let nextRank = 1
    for (const rr of [1, 2, 3, 4, 5]) {
      if (!used.has(rr)) { nextRank = rr; break }
    }
    targetRow = {
      _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      universityName: '',
      courseTitle: '',
      courseLink: '',
      offer: '',
      ucasPoints: '',
      ranking: nextRank
    }
    rows.push(targetRow)
  }

  targetRow.universityName = uniFinal
  targetRow.courseTitle = titleFinal
  targetRow.courseLink = link

  offersDraft.value = [...rows]
  showTemporaryMessage('Added to your choices (remember to Save choices).', 'success')
}

const toggleChip = (field, value) => {
  const intake = uniguideIntake.value || {}
  const arr = Array.isArray(intake[field]) ? [...intake[field]] : []
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  uniguideIntake.value = { ...intake, [field]: arr }
}

// UCAS Application modal state (student edits; staff read + comment)
const ucasModalOpen = ref(false)
const openUcasApplication = () => {
  ucasModalOpen.value = true
}

// Allow deep-linking to UCAS Application from staff tools (e.g. Staff Overview).
// Example:
//   https://...#vespa-coaching-report?email=student@...&open=ucas
try {
  const hash = String(window.location.hash || '')
  const qIdx = hash.indexOf('?')
  const qs = qIdx >= 0 ? hash.slice(qIdx + 1) : ''
  const params = new URLSearchParams(qs)
  const open = (params.get('open') || '').toLowerCase().trim()
  if (open === 'ucas') {
    // Open immediately so staff land straight on the UCAS Application modal.
    setTimeout(() => {
      try {
        openUcasApplication()
      } catch (_) {}
    }, 250)
  }
} catch (_) {}

// Fallback deep-linking: Staff Overview sets a localStorage flag before opening the report.
// This works even if Knack strips unknown hash parameters.
try {
  const raw = localStorage.getItem('vespa_open_ucas')
  if (raw) {
    const payload = JSON.parse(raw)
    const flagEmail = String(payload?.email || '').trim().toLowerCase()
    const ts = Number(payload?.ts || 0)
    const ageMs = Date.now() - ts
    const target = String(props.student?.email || '').trim().toLowerCase()
    if (flagEmail && target && flagEmail === target && ageMs >= 0 && ageMs < 2 * 60 * 1000) {
      setTimeout(() => {
        try {
          openUcasApplication()
        } catch (_) {}
      }, 350)
    }
  }
  // Always clear the one-shot flag
  localStorage.removeItem('vespa_open_ucas')
} catch (_) {}

const academicProfileApiUrl = computed(() => {
  try {
    return (window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl || '').toString()
  } catch (_) {
    return ''
  }
})

const currentUserEmail = computed(() => {
  try {
    if (typeof Knack === 'undefined') return ''
    if (Knack.getUserAttributes) {
      return (Knack.getUserAttributes()?.email || '').toString().trim()
    }
    // Fallbacks for older/embedded Knack contexts
    const fromSession =
      Knack?.session?.user?.attributes?.email ||
      Knack?.session?.user?.email ||
      ''
    return String(fromSession || '').trim()
  } catch (_) {
    return ''
  }
})

// In this report context, "student" means the logged-in user is viewing their own profile.
// This is more reliable than role-name heuristics (staff often have multiple roles).
const isStudent = computed(() => {
  const me = (currentUserEmail.value || '').toString().trim().toLowerCase()
  const target = (props.student?.email || '').toString().trim().toLowerCase()
  return !!me && !!target && me === target
})

const isStaff = computed(() => !isStudent.value)

const isKs4 = computed(() => {
  const raw = (props.student?.yearGroup ?? '').toString()
  const m = raw.match(/(\d{1,2})/)
  const n = m ? parseInt(m[1], 10) : NaN
  return Number.isFinite(n) && n <= 11
})

const defaultMegFromSchool = computed(() => {
  const v = props.uiDefaults && Object.prototype.hasOwnProperty.call(props.uiDefaults, 'studentsShowMeg')
    ? props.uiDefaults.studentsShowMeg
    : undefined
  return v === undefined || v === null ? true : !!v
})

const defaultStgFromSchool = computed(() => {
  const v = props.uiDefaults && Object.prototype.hasOwnProperty.call(props.uiDefaults, 'studentsShowStg')
    ? props.uiDefaults.studentsShowStg
    : undefined
  return v === undefined || v === null ? false : !!v
})

// Apply school defaults everywhere on first load.
// - Students: always enforced (no toggles)
// - Staff: used as initial state, then staff can override locally
watch(
  [defaultMegFromSchool, defaultStgFromSchool, isStudent],
  () => {
    // KS4: no STG; "MEG visibility" becomes "Predicted grade visibility"
    if (isKs4.value) {
      if (isStudent.value) {
        showPredicted.value = defaultMegFromSchool.value
        showMeg.value = false
        showStg.value = false
        return
      }
      if (!userOverrodeVisibility.value) {
        showPredicted.value = defaultMegFromSchool.value
        showMeg.value = false
        showStg.value = false
      }
      return
    }
    if (isStudent.value) {
      // Enforced for students (source of truth = school settings)
      showMeg.value = defaultMegFromSchool.value
      showStg.value = defaultStgFromSchool.value
      return
    }
    // Staff: only set defaults if they haven't toggled yet this session
    if (!userOverrodeVisibility.value) {
      showMeg.value = defaultMegFromSchool.value
      showStg.value = defaultStgFromSchool.value
    }
  },
  { immediate: true }
)

const toggleMeg = () => {
  userOverrodeVisibility.value = true
  showMeg.value = !showMeg.value
}

const toggleStg = () => {
  userOverrodeVisibility.value = true
  showStg.value = !showStg.value
}

const togglePredicted = () => {
  userOverrodeVisibility.value = true
  showPredicted.value = !showPredicted.value
}

// Helper: coerce json-ish values into clean strings for UI (prevents [object Object])
const coerceText = (v) => {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.length ? coerceText(v[0]) : ''
  if (typeof v === 'object') {
    for (const k of ['identifier', 'name', 'text', 'label', 'value']) {
      if (v && v[k]) return String(v[k]).trim()
    }
    try { return JSON.stringify(v) } catch (e) { return '' }
  }
  return String(v).trim()
}

const displayStudentName = computed(() => coerceText(props.student?.name) || 'Student')
const displaySchool = computed(() => coerceText(props.student?.school) || 'N/A')
const displayYearGroup = computed(() => coerceText(props.student?.yearGroup))
const displayTutorGroup = computed(() => coerceText(props.student?.tutorGroup))

const studentInitials = computed(() => {
  const name = (displayStudentName.value || '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || '—'
})

const normalizeOffer = (o) => {
  const uni = coerceText(o?.universityName ?? o?.university_name)
  const course = coerceText(o?.courseTitle ?? o?.course_title)
  const link = coerceText(o?.courseLink ?? o?.course_link)
  const offer = coerceText(o?.offer ?? o?.offerText ?? o?.offer_text)
  const ucasRaw = (o?.ucasPoints ?? o?.ucas_points)
  const rankRaw = (o?.ranking ?? o?.rank)
  const ranking = Number.isFinite(Number(rankRaw)) ? parseInt(rankRaw, 10) : 1
  const ucasPoints = (ucasRaw === null || ucasRaw === undefined || String(ucasRaw).trim() === '') ? null : parseInt(ucasRaw, 10)
  return {
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: uni,
    courseTitle: course,
    courseLink: link,
    offer: offer,
    ucasPoints: Number.isFinite(ucasPoints) ? ucasPoints : null,
    ranking: Math.min(5, Math.max(1, Number.isFinite(ranking) ? ranking : 1))
  }
}

const offers = computed(() => {
  const raw = props.student?.universityOffers
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map(normalizeOffer)
    .filter(o => (o.universityName || o.courseTitle || o.courseLink || o.offer || (o.ucasPoints !== null && o.ucasPoints !== undefined)))
    .slice(0, 5)
})

const sortedOffers = computed(() => {
  return [...offers.value]
    .sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
    .map((o, idx) => ({ ...o, _key: o._key || `${idx}` }))
})

const topOffer = computed(() => {
  return sortedOffers.value.length ? sortedOffers.value[0] : null
})

const toggleOffersExpanded = () => {
  offersExpanded.value = !offersExpanded.value
}

const formattedUpdatedAt = computed(() => {
  if (!props.updatedAt) return ''
  const d = new Date(props.updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
})

const openOffersEditor = () => {
  offersDraft.value = sortedOffers.value.map(o => ({
    _key: o._key || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: o.universityName || '',
    courseTitle: o.courseTitle || '',
    courseLink: o.courseLink || '',
    offer: o.offer || '',
    ucasPoints: (o.ucasPoints === null || o.ucasPoints === undefined) ? '' : String(o.ucasPoints),
    ranking: o.ranking || 1
  }))
  offersEditorTab.value = 'ai'
  offersEditorOpen.value = true
  // hydrate intake on open
  try {
    loadUniGuideProfile().then(() => {
      if (!uniguidePrefsCompleted.value && !String(uniguideProfileError.value || '').trim()) {
        openUniGuidePrefs()
        return
      }
      if ((uniguideChatMessages.value || []).length === 0) {
        try { startUniGuideChat() } catch (_) {}
      }
    })
  } catch (_) {}
}

const closeOffersEditor = () => {
  if (uniguidePrefsRequired.value) {
    openUniGuidePrefs()
    try { showTemporaryMessage('Please complete your UniGuide preferences first.', 'error') } catch (_) {}
    return
  }
  offersEditorOpen.value = false
  offersEditorTab.value = 'ai'
  offersDraft.value = []
  uniguideChatMessages.value = []
  uniguideChatError.value = ''
  uniguideChatInput.value = ''
  uniguideSessionId.value = null
  uniguideManualEditRank.value = null
  uniguidePrefsOpen.value = false
}

const uniguidePrevBodyOverflow = ref(null)
watch(
  () => offersEditorOpen.value,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      uniguidePrevBodyOverflow.value = document.body.style.overflow || ''
      document.body.style.overflow = 'hidden'
      return
    }
    document.body.style.overflow = uniguidePrevBodyOverflow.value || ''
    uniguidePrevBodyOverflow.value = null
  }
)

const addOfferRow = () => {
  if (offersDraft.value.length >= 5) return
  const used = new Set(offersDraft.value.map(r => Number(r.ranking)))
  let nextRank = 1
  for (const r of [1, 2, 3, 4, 5]) {
    if (!used.has(r)) { nextRank = r; break }
  }
  offersDraft.value.push({
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: '',
    courseTitle: '',
    courseLink: '',
    offer: '',
    ucasPoints: '',
    ranking: nextRank
  })
}

const safeCourseLink = (raw) => {
  const s = (raw || '').toString().trim()
  if (!s) return null
  const low = s.toLowerCase()
  if (low.startsWith('javascript:') || low.startsWith('data:')) return null
  if (low.startsWith('http://') || low.startsWith('https://')) return s
  if (low.startsWith('www.')) return `https://${s}`
  if (s.includes('.') && !s.includes(' ')) return `https://${s}`
  return null
}

const removeOfferRow = (idx) => {
  offersDraft.value.splice(idx, 1)
  if (offersDraft.value.length === 0) uniguideManualEditRank.value = null
}

const saveOffers = async () => {
  if (!props.offersEditable) return
  offersSaving.value = true
  try {
    const cleaned = offersDraft.value
      .map(r => ({
        universityName: (r.universityName || '').trim(),
        courseTitle: (r.courseTitle || '').trim(),
        courseLink: (safeCourseLink(r.courseLink) || ''),
        offer: (r.offer || '').trim(),
        ucasPoints: (r.ucasPoints === null || r.ucasPoints === undefined || String(r.ucasPoints).trim() === '') ? null : parseInt(r.ucasPoints, 10),
        ranking: parseInt(r.ranking, 10)
      }))
      .filter(r => r.universityName || r.courseTitle || r.courseLink || r.offer || (r.ucasPoints !== null && r.ucasPoints !== undefined))
      .slice(0, 5)

    const ranks = cleaned.map(r => r.ranking).filter(Boolean)
    const unique = new Set(ranks)
    if (ranks.length !== unique.size) throw new Error('Each offer must have a unique ranking (1-5).')
    for (const r of cleaned) {
      if (!(r.ranking >= 1 && r.ranking <= 5)) throw new Error('Ranking must be between 1 and 5.')
      if (r.ucasPoints !== null && !Number.isFinite(r.ucasPoints)) throw new Error('UCAS points must be a number.')
    }

    const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
    const email = props.student?.email
    const year = props.academicYear || null
    const resp = await updateUniversityOffers(email, cleaned, apiUrl, year)
    if (!resp || !resp.success) throw new Error(resp?.error || 'Failed to save offers')

    closeOffersEditor()
    emit('reload')
    showTemporaryMessage('University offers saved.', 'success')
  } catch (e) {
    console.error('[Academic Profile] saveOffers error:', e)
    showTemporaryMessage(e.message || 'Failed to save offers', 'error')
  } finally {
    offersSaving.value = false
  }
}

// Toggle edit mode
const toggleEditMode = async () => {
  if (isEditMode.value) {
    // Save all changes
    await saveAllChanges()
  }
  isEditMode.value = !isEditMode.value
}

// Handle individual subject update
const handleSubjectUpdate = (subjectId, field, value) => {
  // Students can edit ONLY Target grade
  if (isStudent.value && field !== 'targetGrade') {
    console.warn('[Academic Profile] Student attempted to edit forbidden field:', field)
    showTemporaryMessage('You can only edit your Target grade.', 'error')
    return
  }
  // Store pending changes
  if (!pendingChanges.value[subjectId]) {
    pendingChanges.value[subjectId] = {}
  }
  pendingChanges.value[subjectId][field] = value
  
  console.log('[Academic Profile] Change tracked:', { subjectId, field, value })
}

// Save all pending changes
const saveAllChanges = async () => {
  if (Object.keys(pendingChanges.value).length === 0) {
    console.log('[Academic Profile] No changes to save')
    return
  }

  saving.value = true

  try {
    const updatePromises = []
    
    // Update each subject that has changes
    for (const [subjectId, changes] of Object.entries(pendingChanges.value)) {
      const safeChanges = isStudent.value ? { targetGrade: changes.targetGrade } : changes
      // Skip if student has no target changes for this subject
      if (isStudent.value && safeChanges.targetGrade === undefined) continue
      updatePromises.push(
        updateSubjectGrade(subjectId, safeChanges, window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl)
      )
    }

    if (updatePromises.length === 0) {
      pendingChanges.value = {}
      return
    }

    const results = await Promise.all(updatePromises)
    
    const allSuccess = results.every(r => r.success)
    
    if (allSuccess) {
      console.log('[Academic Profile] All changes saved successfully')
      
      // Clear pending changes
      pendingChanges.value = {}
      
      // Reload data from server
      emit('reload')
      
      // Show success message
      showTemporaryMessage('All changes saved successfully!', 'success')
    } else {
      throw new Error('Some updates failed')
    }
  } catch (err) {
    console.error('[Academic Profile] Save error:', err)
    showTemporaryMessage('Error saving changes. Please try again.', 'error')
  } finally {
    saving.value = false
  }
}

// Format percentage
const formatPercentage = (decimal) => {
  if (decimal === null || decimal === undefined) return 'N/A'
  return `${Math.round(decimal * 100)}%`
}

// In-app toast (avoid native browser alerts)
const toast = ref({ open: false, message: '', type: 'info' })
let toastTimer = null

const showTemporaryMessage = (message, type = 'info') => {
  const msg = (message || '').toString().trim()
  if (!msg) return
  if (toastTimer) {
    try { clearTimeout(toastTimer) } catch (_) {}
    toastTimer = null
  }
  toast.value = { open: true, message: msg, type }
  toastTimer = setTimeout(() => {
    toast.value = { ...toast.value, open: false }
  }, 2400)
}

const closeToast = () => {
  if (toastTimer) {
    try { clearTimeout(toastTimer) } catch (_) {}
    toastTimer = null
  }
  toast.value = { ...toast.value, open: false }
}
</script>

<style scoped>
/* Container */
.vespa-profile-display {
  margin-bottom: 24px;
  width: 100%;
  max-width: 100% !important;
  box-sizing: border-box;
}

.vespa-section {
  /* Palette (from redesign prototype) */
  --brand-darkest: #0f1629;
  --brand-dark: #1a2342;
  --brand-mid: #242f4e;
  --brand-light: #2d3a5c;
  --accent: #4ecdc4;
  --accent-light: #7ee8e2;
  --accent-glow: rgba(78, 205, 196, 0.15);
  --purple: #8b7ec8;
  --purple-light: #a99fda;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.75);
  --text-muted: rgba(255, 255, 255, 0.5);

  background: linear-gradient(145deg, var(--brand-dark) 0%, var(--brand-mid) 100%);
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  padding: 16px;
  border: 1px solid rgba(78, 205, 196, 0.16);
  position: relative;
  overflow: hidden;
}

/* KS4 theme (distinct from KS5): dark green */
.vespa-section.ks4-theme {
  background-color: #0f2b1a;
  border-color: rgba(124, 255, 154, 0.55);
}

.vespa-section.ks4-theme .profile-info-button {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.8);
}

.vespa-section.ks4-theme .profile-info-button:hover {
  background-color: #7CFF9A;
  color: #0f2b1a;
}

.vespa-section.ks4-theme .small-toggle {
  border-color: rgba(124, 255, 154, 0.3);
}

.vespa-section.ks4-theme .master-edit-icon.edit-icon {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.85);
}

/* Header (new redesign) */
.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 14px;
  margin: -16px -16px 14px;
  background: linear-gradient(135deg, var(--brand-mid) 0%, var(--brand-light) 100%);
  border-bottom: 1px solid rgba(78, 205, 196, 0.12);
  position: relative;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--purple), var(--accent));
  opacity: 0.85;
}

.vespa-section.ks4-theme .profile-header {
  background: linear-gradient(135deg, rgba(18, 53, 34, 0.92) 0%, rgba(15, 43, 26, 0.92) 100%);
  border-bottom-color: rgba(124, 255, 154, 0.22);
}

.vespa-section.ks4-theme .profile-header::before {
  background: linear-gradient(90deg, rgba(124, 255, 154, 0.95), rgba(78, 205, 196, 0.60), rgba(124, 255, 154, 0.95));
}

.profile-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--brand-darkest);
  background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  flex: 0 0 auto;
}

.vespa-section.ks4-theme .profile-avatar {
  background: linear-gradient(135deg, rgba(124, 255, 154, 0.95) 0%, rgba(78, 205, 196, 0.85) 100%);
}

.profile-header-text {
  min-width: 0;
}

.profile-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-title {
  font-weight: 950;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.vespa-section.ks4-theme .profile-title {
  color: rgba(124, 255, 154, 0.85);
}

.profile-student-name {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 10px;
}

.profile-meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.profile-meta-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.profile-meta-value {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-primary);
}

@media (max-width: 780px) {
  .profile-header {
    flex-direction: column;
    align-items: stretch;
  }
  .profile-actions {
    justify-content: flex-start;
  }
}

/* KS4 subjects layout is controlled by `.subjects-grid.ks4-grid` below */

/* KS4 layout: compact strip on top, then a 3-column grid by default */
.profile-info.ks4-layout {
  flex-direction: column;
}

.profile-info.ks5-layout {
  flex-direction: column;
}

.profile-details.ks4-profile-strip {
  width: 100%;
  min-height: auto;
  padding: 12px 14px;
}

.profile-details.ks5-profile-strip {
  width: 100%;
  min-height: auto;
  padding: 12px 14px;
}

.profile-details.ks4-profile-strip .profile-name {
  font-size: 20px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.profile-details.ks5-profile-strip .profile-name {
  font-size: 20px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.profile-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.profile-details.ks4-profile-strip .profile-item {
  margin-bottom: 0;
  padding: 4px 0;
}

.profile-details.ks5-profile-strip .profile-item {
  margin-bottom: 0;
  padding: 4px 0;
}

.vespa-section.ks4-theme .subjects-grid.ks4-grid {
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: 8px;
  align-items: start;
  grid-auto-rows: auto;
}

/* KS5 layout: profile strip on top, subjects full width */
.profile-info.ks5-layout .subjects-container {
  width: 100%;
  min-width: 0;
  min-height: auto;
}

@media (max-width: 1050px) {
  .vespa-section.ks4-theme .subjects-grid.ks4-grid {
    grid-template-columns: repeat(2, minmax(190px, 1fr));
  }
}

@media (max-width: 620px) {
  .vespa-section.ks4-theme .subjects-grid.ks4-grid {
    grid-template-columns: 1fr;
  }
}

.profile-actions {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.small-toggle {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.small-toggle:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Info button */
.profile-info-button {
  font-size: 14px;
  color: var(--accent);
  cursor: pointer;
  border: 1px solid rgba(78, 205, 196, 0.95);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
  background: rgba(0, 0, 0, 0.20);
}

.profile-info-button:hover {
  background-color: rgba(78, 205, 196, 0.92);
  color: var(--brand-darkest);
}

/* Edit button */
.master-edit-icon {
  cursor: pointer;
  font-size: 0.7em;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.master-edit-icon.edit-icon {
  color: #00e5db;
  border-color: #00e5db;
}

.master-edit-icon.save-icon {
  color: #4caf50;
  border-color: #4caf50;
}

.master-edit-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Profile layout */
.profile-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: stretch;
}

.profile-details {
  flex: 1;
  min-width: 200px;
  min-height: 170px;
  background-color: #334285;
  border-radius: 8px;
  border: 1px solid rgba(7, 155, 170, 0.3);
  padding: 16px;
}

.profile-name {
  font-size: 22px;
  color: #00e5db;
  margin-bottom: 12px;
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(7, 155, 170, 0.3);
}

.profile-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.profile-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.profile-label {
  font-weight: 600;
  color: #00e5db;
  margin-right: 8px;
}

.profile-value {
  color: #f0f0f0;
}

/* Subjects */
.subjects-container {
  flex: 2;
  min-width: 280px;
  min-height: 170px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 640px) {
  /* Phone: prioritize readability over density */
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.no-subjects {
  padding: 20px;
  text-align: center;
  color: #cccccc;
  font-style: italic;
}

/* University Offers */
.university-offers {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  /* Contrast palette (from redesign prototype) */
  --offers-primary: #f093a0;
  --offers-secondary: #e8788a;
  --offers-dark: #2a1f35;
  --offers-mid: #352a42;
  --offers-glow: rgba(240, 147, 160, 0.12);

  background: linear-gradient(145deg, var(--offers-dark) 0%, var(--offers-mid) 100%);
  border: 1px solid rgba(240, 147, 160, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px var(--offers-glow);
  overflow: hidden;
}

.university-offers::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--offers-primary), var(--offers-secondary));
  opacity: 0.9;
}

.university-offers::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(420px circle at 6% -20%, rgba(240, 147, 160, 0.35), transparent 55%);
  opacity: 0.5;
  pointer-events: none;
}

.university-offers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.offers-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.offers-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2a1f35;
  background: linear-gradient(135deg, var(--offers-primary) 0%, var(--offers-secondary) 100%);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  flex: 0 0 auto;
}

.offers-title-group {
  min-width: 0;
}

.university-offers-title {
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 0.3px;
  color: #ffffff;
  line-height: 1.2;
}

.offers-count {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255,255,255,0.78);
  font-weight: 700;
}

.university-offers-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offers-ucasapp-btn,
.offers-edit-btn,
.offers-toggle-btn,
.offers-add-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  padding: 9px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.offers-ucasapp-btn {
  background: rgba(62, 50, 133, 0.35);
  border-color: rgba(62, 50, 133, 0.70);
}

.offers-edit-btn {
  background: rgba(232, 119, 34, 0.22);
  border-color: rgba(232, 119, 34, 0.55);
}

.offers-ucasapp-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.offers-toggle-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.offers-chevron {
  display: inline-block;
  margin-right: 6px;
  transition: transform 0.18s ease;
}

.offers-chevron.open {
  transform: rotate(180deg);
}

.offers-ucasapp-btn:hover,
.offers-edit-btn:hover,
.offers-toggle-btn:hover,
.offers-add-btn:hover {
  background: rgba(255, 255, 255, 0.10);
}

.university-offers-top,
.offer-item {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(145deg, #241f55, #2c2470);
  border: 1px solid rgba(62, 50, 133, 0.35);
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}

.offer-top-toggle {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.offer-top-toggle:focus {
  outline: 2px solid rgba(62, 50, 133, 0.75);
  outline-offset: 2px;
}

.offer-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.offer-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(62, 50, 133, 0.25);
  border: 1px solid rgba(62, 50, 133, 0.78);
  font-weight: 900;
  color: #efeaff;
}

.offer-uni {
  font-weight: 950;
  font-size: 17px;
  color: #ffffff;
}

.offer-course {
  color: rgba(255,255,255,0.95);
  font-weight: 600;
}

.offer-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.offer-pill {
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(62, 50, 133, 0.55);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

.offer-link-btn {
  text-decoration: none;
  background: rgba(62, 50, 133, 0.25);
  border: 1px solid rgba(62, 50, 133, 0.7);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
}

.offer-link-btn:hover {
  background: rgba(62, 50, 133, 0.35);
}

.university-offers-empty {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}

/* Mobile: make University Choices header stack (avoid title/buttons overlap) */
@media (max-width: 640px) {
  .vespa-section {
    padding: 12px;
    border-radius: 12px;
  }

  .profile-header {
    padding: 14px 14px 12px;
    margin: -12px -12px 12px;
  }

  .university-offers {
    padding: 14px;
  }

  .university-offers-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .offers-header-left {
    width: 100%;
  }

  .university-offers-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .offers-toggle-btn {
    grid-column: 1 / -1;
  }

  .offers-ucasapp-btn,
  .offers-edit-btn,
  .offers-toggle-btn,
  .offers-add-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 10px 12px;
  }
}

@media (max-width: 420px) {
  .university-offers-actions {
    grid-template-columns: 1fr;
  }

  .offers-toggle-btn {
    grid-column: auto;
  }
}

.university-offers-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.offer-expand-hint {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  font-weight: 700;
}

/* UniGuide (full-screen modal, from uniguide-exemplar.html) */
.offers-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 20, 38, 0.75);
  /* Backdrop blur looks "grainy" on Windows/Knack embeds; keep it crisp. */
  backdrop-filter: none;
  z-index: 10001;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
}

.offers-modal {
  /* Design tokens */
  --navy: #0D2B4E;
  --navy-mid: #1B4F8A;
  --navy-light: #2A6BC2;
  --amber: #E87722;
  --amber-light: #F09B52;
  --cream: #FDF9F4;
  --cream-border: #EDE6D8;
  --slate: #5A7A9A;
  --text: #1A2B3C;
  --muted: #7A8FA6;
  --white: #FFFFFF;
  --green: #1B7A4A;
  --green-bg: #EAF7F0;
  --red-bg: #FFF0EC;
  --blue-bg: #EEF4FF;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(13,43,78,0.12), 0 1px 4px rgba(13,43,78,0.08);
  --shadow-lg: 0 20px 60px rgba(13,43,78,0.25), 0 4px 16px rgba(13,43,78,0.12);
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  --font-mono: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  width: 100vw;
  height: 100vh;
  background: var(--cream);
  border-radius: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: none;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Toast */
.toast{
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  width: min(720px, calc(100% - 28px));
  border-radius: 12px;
  border: 1px solid rgba(13,43,78,0.16);
  box-shadow: 0 14px 40px rgba(13,43,78,0.22);
  background: rgba(255,255,255,0.96);
}
.toast.success{
  border-color: rgba(27,122,74,0.20);
  background: rgba(234,247,240,0.96);
}
.toast.error{
  border-color: rgba(192,57,43,0.22);
  background: rgba(255,240,236,0.96);
}
.toast.info{
  border-color: rgba(27,79,138,0.18);
  background: rgba(238,244,255,0.96);
}
.toast-inner{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}
.toast-msg{
  font-size: 13px;
  font-weight: 700;
  color: rgba(13,43,78,0.92);
}
.toast-close{
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(13,43,78,0.14);
  background: white;
  color: rgba(13,43,78,0.85);
  cursor: pointer;
  font-weight: 900;
  line-height: 1;
}
.toast-close:hover{
  background: rgba(238,244,255,0.9);
  border-color: rgba(13,43,78,0.22);
}

.prefs-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(13, 43, 78, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  z-index: 5;
}

.prefs-modal {
  width: min(1020px, 100%);
  max-height: calc(100vh - 44px);
  background: var(--cream);
  border: 1px solid var(--cream-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: auto;
}

.prefs-modal-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid var(--cream-border);
  background: rgba(253, 249, 244, 0.94);
  position: sticky;
  top: 0;
  z-index: 1;
}

.prefs-required-hint {
  padding: 10px 18px 16px;
  font-size: 12px;
  color: var(--muted);
}

.modal-header {
  background: var(--navy);
  padding: 18px 22px 0;
  flex-shrink: 0;
}

.modal-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.modal-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: var(--amber);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.brand-text h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.3px;
  line-height: 1;
  margin-bottom: 3px;
}

.brand-text p {
  font-size: 12px;
  color: var(--slate);
  font-weight: 400;
}

.modal-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.student-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 30px;
  padding: 6px 14px 6px 8px;
}

.student-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E87722, #F09B52);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: white;
}

.student-info {
  font-size: 11.5px;
  color: rgba(255,255,255,0.8);
  line-height: 1.3;
}

.student-info strong {
  display: block;
  font-weight: 700;
  font-size: 12px;
  color: white;
}

.offers-ucas-link {
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.92);
  padding: 7px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}

.offers-ucas-link:hover { border-color: rgba(255,255,255,0.30); }

.close-btn {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 8px;
  color: rgba(255,255,255,0.75);
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.close-btn:hover { background: rgba(255,255,255,0.18); color: white; }

.tabs {
  display: flex;
  gap: 2px;
}

.tab {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;
  position: relative;
}

.tab:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }

.tab.active {
  background: var(--cream);
  color: var(--navy);
}

.tab-icon { font-size: 15px; }

.tab-badge {
  background: var(--amber);
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

.tab-badge-blue { background: var(--navy-light); }

/* ────────────────────────────────────────────────────────────────────────────
   Preferences wizard (UniGuide intake)
   ──────────────────────────────────────────────────────────────────────────── */
.prefs-layout{
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 18px 10px;
}

/* Preferences popup overlay (inside UniGuide modal) */
.prefs-modal-overlay{
  position: absolute;
  inset: 0;
  background: rgba(7, 20, 38, 0.62);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
}

.prefs-modal{
  width: min(980px, 100%);
  max-height: min(82vh, 860px);
  background: var(--cream);
  border: 1px solid var(--cream-border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.prefs-modal-top{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 10px;
  border-bottom: 1px solid rgba(13,43,78,0.08);
  background: linear-gradient(180deg, rgba(238,244,255,0.55), rgba(253,249,244,0.0));
}

.prefs-modal .prefs-progress{
  padding: 12px 18px 0;
}

.prefs-modal .prefs-body{
  padding: 12px 18px 0;
  overflow: auto;
}

.prefs-modal .prefs-nav{
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(13,43,78,0.08);
  background: rgba(253,249,244,0.86);
}

.prefs-required-hint{
  padding: 10px 18px 16px;
  font-size: 12.5px;
  color: rgba(13,43,78,0.75);
  font-weight: 600;
}
.prefs-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  margin-bottom:12px;
}
.prefs-title{
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 2px;
}
.prefs-subtitle{
  color: var(--muted);
  font-size: 13.5px;
}
.prefs-progress{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  background: white;
  border: 1px solid var(--cream-border);
  border-radius: var(--radius);
  padding: 10px 12px;
  box-shadow: 0 2px 10px rgba(13,43,78,0.06);
  margin-bottom: 14px;
}
.prefs-step{
  display:flex;
  align-items:center;
  gap:8px;
  border: 1px solid var(--cream-border);
  border-radius: 999px;
  padding: 8px 10px;
  background: var(--cream);
  color: var(--navy);
  font-weight: 600;
  font-size: 13px;
}
.prefs-step.active{
  background: rgba(232,119,34,0.12);
  border-color: rgba(232,119,34,0.35);
}
.prefs-step.done{
  background: rgba(27,122,74,0.10);
  border-color: rgba(27,122,74,0.25);
}
.prefs-dot{
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: white;
  border: 1px solid var(--cream-border);
  font-weight: 900;
  font-size: 13px;
}
.prefs-step.active .prefs-dot{ border-color: rgba(232,119,34,0.45); }
.prefs-step.done .prefs-dot{ border-color: rgba(27,122,74,0.35); }
.prefs-body{
  background: white;
  border: 1px solid var(--cream-border);
  border-radius: var(--radius);
  padding: 14px 14px 10px;
  box-shadow: 0 2px 12px rgba(13,43,78,0.06);
}
.prefs-eyebrow{
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--navy-mid);
  margin-bottom: 10px;
}
.prefs-panel-title{
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 2px;
}
.prefs-panel-desc{
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 11.5px;
  font-style: italic;
  margin-bottom: 12px;
}
.prefs-divider{ height: 1px; background: var(--cream-border); margin: 14px 0; }
.prefs-small-title{
  font-weight: 800;
  color: var(--navy);
  font-size: 13.5px;
  margin: 10px 0 8px;
}
.prefs-card-grid{
  display:grid;
  gap: 12px;
  margin-bottom: 12px;
}
.prefs-card-grid.cols-2{ grid-template-columns: repeat(2, minmax(0,1fr)); }
.prefs-card-grid.cols-3{ grid-template-columns: repeat(3, minmax(0,1fr)); }
.prefs-card-grid.cols-4{ grid-template-columns: repeat(4, minmax(0,1fr)); }
.prefs-grid-2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.prefs-card{
  text-align:left;
  background: var(--cream);
  border: 1px solid var(--cream-border);
  border-radius: var(--radius);
  padding: 12px 12px 10px;
  color: var(--text);
  box-shadow: 0 1px 0 rgba(13,43,78,0.03);
  transition: transform .08s ease, border-color .12s ease, background .12s ease;
}
.prefs-card:hover{ transform: translateY(-1px); border-color: rgba(13,43,78,0.22); }
.prefs-card.selected{
  background: rgba(232,119,34,0.12);
  border-color: rgba(232,119,34,0.35);
}
.prefs-card.compact{ padding: 10px 10px 8px; }
.prefs-ico{
  font-size: 18px;
  margin-bottom: 6px;
}
.prefs-card-title{
  font-weight: 600;
  font-family: var(--font-body);
  font-size: 13.5px;
  color: var(--navy);
  margin-bottom: 2px;
}
.prefs-card-sub{
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 400;
}
.prefs-label{
  display:block;
  font-weight: 600;
  font-size: 13.5px;
  font-family: var(--font-body);
  color: var(--navy);
  margin: 8px 0 6px;
}
.prefs-input{
  width: 100%;
  border: 1px solid var(--cream-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 15px;
}
.prefs-textarea{
  width: 100%;
  border: 1px solid var(--cream-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 15px;
  resize: vertical;
  min-height: 90px;
}
.prefs-input:focus,
.prefs-textarea:focus{
  outline: none;
  border-color: rgba(13,43,78,0.35);
  box-shadow: 0 0 0 3px rgba(13,43,78,0.08);
  background: white;
}
.prefs-chip-row{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.prefs-chip{
  border: 1px solid var(--cream-border);
  background: var(--cream);
  border-radius: 999px;
  padding: 10px 12px;
  font-weight: 800;
  color: var(--navy);
}
.prefs-chip.selected{
  background: rgba(232,119,34,0.12);
  border-color: rgba(232,119,34,0.35);
}
.prefs-nav{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 14px 2px 6px;
}
.prefs-nav-mid{ color: var(--muted); font-weight: 800; }
.prefs-nav-mid{
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

@media (max-width: 980px){
  .prefs-card-grid.cols-4{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .prefs-card-grid.cols-3{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .prefs-grid-2{ grid-template-columns: 1fr; }
}
@media (max-width: 560px){
  .prefs-card-grid.cols-2,
  .prefs-card-grid.cols-3,
  .prefs-card-grid.cols-4{ grid-template-columns: 1fr; }
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-content {
  display: none;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.tab-content.active { display: flex; }

/* AI layout */
.ai-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.ai-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid var(--cream-border);
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.sidebar-label {
  font-size: 10px;
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0 4px;
  margin-top: 10px;
}
.sidebar-label:first-child { margin-top: 0; }

.sidebar-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--cream);
  border-radius: var(--radius-sm);
  border: 1px solid var(--cream-border);
}

.stat-icon { font-size: 14px; flex-shrink: 0; }
.stat-body { flex: 1; min-width: 0; }

.stat-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 700;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phase-indicator {
  margin-top: 4px;
  padding: 12px;
  background: linear-gradient(135deg, #EEF4FF, #E8F0FB);
  border-radius: var(--radius-sm);
  border: 1px solid #C5D8F5;
}

.phase-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--navy-mid);
  font-weight: 800;
  margin-bottom: 8px;
}

.phase-steps { display: flex; flex-direction: column; gap: 4px; }

.phase-step {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--muted);
  padding: 3px 0;
}

.phase-step.done { color: var(--green); }
.phase-step.current { color: var(--navy); font-weight: 800; }

.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D0D8E4;
  flex-shrink: 0;
}
.phase-step.done .phase-dot { background: var(--green); }
.phase-step.current .phase-dot {
  background: var(--amber);
  box-shadow: 0 0 0 3px rgba(232,119,34,0.2);
}

.form-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--navy);
  margin: 4px 4px 0;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--cream-border);
  background: var(--cream);
  font-size: 12.5px;
  color: var(--text);
  outline: none;
  resize: vertical;
  font-family: inherit;
}
.form-textarea:focus { border-color: var(--navy-mid); background: white; }

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-chip.active {
  background: var(--navy);
  border-color: var(--navy);
  color: white;
}

.sidebar-actions { margin-top: 6px; }

.prefs-summary {
  margin-top: 6px;
  margin-bottom: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(13, 43, 78, 0.10);
  background: rgba(13, 43, 78, 0.04);
}

.prefs-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
}

.prefs-summary-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.prefs-summary-value {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text);
  text-align: right;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: var(--red-bg);
  color: #8A2E26;
  border: 1px solid rgba(192, 57, 43, 0.20);
}

.status-pill.ok {
  background: var(--green-bg);
  color: var(--green);
  border-color: rgba(27, 122, 74, 0.18);
}

.side-btn {
  width: 100%;
  padding: 9px 12px;
  background: var(--navy);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}
.side-btn:hover { background: var(--navy-mid); }
.side-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.prefs-summary{
  border: 1px solid rgba(13,43,78,0.12);
  background: rgba(255,255,255,0.55);
  border-radius: 12px;
  padding: 10px 10px;
  margin: 6px 0 10px;
}

.prefs-summary-row{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 6px;
  border-bottom: 1px dashed rgba(13,43,78,0.10);
}
.prefs-summary-row:last-child{ border-bottom: 0; }

.prefs-summary-label{
  font-size: 10.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(13,43,78,0.70);
  font-family: var(--font-mono);
}
.prefs-summary-value{
  font-size: 12.5px;
  font-weight: 700;
  color: rgba(13,43,78,0.92);
  text-align: right;
  max-width: 68%;
}

.status-pill{
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  border: 1px solid rgba(13,43,78,0.16);
  background: rgba(238,244,255,0.75);
  color: rgba(13,43,78,0.85);
}
.status-pill.ok{
  border-color: rgba(27, 122, 74, 0.25);
  background: var(--green-bg);
  color: var(--green);
}

.inline-error {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(192, 57, 43, 0.25);
  background: rgba(255, 240, 236, 0.9);
  color: #8A2E26;
  font-size: 12.5px;
  font-weight: 600;
}

.inline-muted {
  color: var(--muted);
  font-size: 12px;
  padding: 0 4px;
}

.chat-error { margin: 8px 16px 0; }

/* Chat (from exemplar) */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--cream-border); border-radius: 2px; }

.msg { display: flex; gap: 10px; }
.msg.user { flex-direction: row-reverse; }

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
}

.msg.ai .msg-avatar { background: var(--navy); color: white; }
.msg.user .msg-avatar { background: linear-gradient(135deg, #E87722, #F09B52); color: white; }

.msg-bubble {
  max-width: 78%;
  padding: 12px 15px;
  border-radius: 16px;
  font-size: 13.5px;
  line-height: 1.6;
}

.msg.ai .msg-bubble {
  background: white;
  color: var(--text);
  border: 1px solid var(--cream-border);
  border-top-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.msg.user .msg-bubble {
  background: var(--navy);
  color: white;
  border-top-right-radius: 4px;
}

.msg-meta {
  font-size: 10px;
  color: var(--muted);
  margin-top: 4px;
  padding: 0 4px;
}
.msg.user .msg-meta { text-align: right; }

.typing-indicator { display: flex; gap: 4px; align-items: center; padding: 14px 16px; }
.typing-dot {
  width: 7px;
  height: 7px;
  background: var(--muted);
  border-radius: 50%;
  animation: typing 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

.chat-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 22px 14px;
}

.option-chip {
  padding: 7px 14px;
  background: white;
  border: 1.5px solid var(--cream-border);
  border-radius: 20px;
  font-size: 12.5px;
  color: var(--navy-mid);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 600;
}
.option-chip:hover { border-color: var(--amber); color: var(--amber); background: #FFF8F0; }

.chat-input-row {
  padding: 14px 18px;
  border-top: 1px solid var(--cream-border);
  background: white;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid var(--cream-border);
  border-radius: 24px;
  font-size: 13.5px;
  color: var(--text);
  background: var(--cream);
  resize: none;
  outline: none;
  line-height: 1.5;
  max-height: 110px;
}
.chat-input:focus { border-color: var(--navy-mid); background: white; }
.chat-input::placeholder { color: var(--muted); }

.send-btn {
  width: 40px;
  height: 40px;
  background: var(--navy);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.send-btn:hover { background: var(--navy-mid); transform: scale(1.05); }
.send-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Search */
.search-layout { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.search-top {
  padding: 18px 22px;
  border-bottom: 1px solid var(--cream-border);
  background: white;
}

.search-bar-row { display: flex; gap: 10px; margin-bottom: 14px; }

.search-input-wrap { flex: 1; position: relative; }

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 15px;
}

.search-input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  border: 1.5px solid var(--cream-border);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  background: var(--cream);
  color: var(--text);
  outline: none;
}
.search-input:focus { border-color: var(--navy-mid); background: white; }

.filters-row { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1.5px solid var(--cream-border);
  border-radius: 20px;
  background: var(--cream);
  font-size: 12px;
  color: var(--text);
  font-weight: 600;
}

.filter-input {
  width: 96px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  font-weight: 600;
  color: inherit;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 16px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.results-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.results-count { font-size: 12px; color: var(--muted); }

/* Course card */
.course-card {
  background: white;
  border: 1.5px solid var(--cream-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: all 0.18s;
  position: relative;
}

.course-card:hover { border-color: var(--navy-mid); box-shadow: var(--shadow); transform: translateX(2px); }

.course-card.saved { border-color: var(--amber); background: #FFFBF6; }

.uni-logo {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: white;
  letter-spacing: -0.5px;
  flex-shrink: 0;
  font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.course-info { flex: 1; min-width: 0; }

.course-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
  font-family: var(--font-display);
}

.uni-name { font-size: 11.5px; color: var(--muted); margin-bottom: 6px; }

.course-tags { display: flex; gap: 5px; flex-wrap: wrap; }

.tag {
  padding: 2px 8px;
  background: var(--cream);
  border: 1px solid var(--cream-border);
  border-radius: 10px;
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.tag.tariff {
  background: var(--blue-bg);
  border-color: #C5D8F5;
  color: var(--navy-mid);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
}

.save-btn {
  padding: 5px 12px;
  border: 1.5px solid var(--cream-border);
  border-radius: 20px;
  background: white;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-decoration: none;
}

.save-btn:hover { border-color: var(--amber); color: var(--amber); }
.save-btn.saved { background: var(--amber); border-color: var(--amber); color: white; }

.ai-reason {
  margin-top: 8px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #EEF4FF, #F0F7FF);
  border-left: 3px solid var(--navy-mid);
  border-radius: 0 6px 6px 0;
  font-size: 11.5px;
  color: var(--navy);
  line-height: 1.55;
  font-style: italic;
  font-family: var(--font-body);
}

.ai-reason-label {
  font-style: normal;
  font-family: var(--font-body);
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--navy-mid);
  font-weight: 600;
  margin-bottom: 3px;
}

/* Manual shortlist */
.manual-layout {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cream-border);
}

.shortlist-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}

.shortlist-subtitle { font-size: 12px; color: var(--muted); margin-top: 2px; }

.add-btn {
  padding: 8px 18px;
  background: var(--navy);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.add-btn:hover { background: var(--navy-mid); }
.add-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.shortlist-cards { display: flex; flex-direction: column; gap: 10px; }

.shortlist-card {
  background: white;
  border: 1.5px solid var(--cream-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
  transition: all 0.15s;
}
.shortlist-card:hover { border-color: #C5D8F5; }

.shortlist-card.first-choice { border-color: var(--amber); background: #FFFBF6; }

.choice-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--cream);
  border: 1.5px solid var(--cream-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: var(--text);
  flex-shrink: 0;
}
.shortlist-card.first-choice .choice-number {
  background: var(--amber);
  border-color: var(--amber);
  color: white;
}

.shortlist-info { flex: 1; min-width: 0; }

.shortlist-course {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-family: var(--font-display);
  margin-bottom: 2px;
}

.shortlist-uni { font-size: 12px; color: var(--muted); }

.shortlist-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 2px 9px;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 800;
  text-decoration: none;
}
.status-badge.applied { background: #EEF4FF; color: var(--navy-mid); }
.status-badge.offer { background: var(--green-bg); color: var(--green); }
.status-badge.watching { background: var(--cream); color: var(--muted); border: 1px solid var(--cream-border); }

.shortlist-actions {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: 1.5px solid var(--cream-border);
  background: white;
  border-radius: 8px;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover { border-color: var(--navy-mid); color: var(--navy); }
.icon-btn.danger:hover { border-color: #E55; color: #E55; }

.empty-slot {
  background: white;
  border: 2px dashed var(--cream-border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--muted);
}
.empty-slot:hover { border-color: var(--navy-mid); color: var(--navy-mid); }

.slot-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px dashed currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}

.shortlist-edit { margin-top: 10px; }
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}
.edit-field span {
  display: block;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 800;
  margin-bottom: 4px;
}
.edit-field input {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--cream-border);
  background: var(--cream);
  font-size: 12.5px;
  color: var(--text);
  outline: none;
}
.edit-field input:focus { border-color: var(--navy-mid); background: white; }

.ucas-summary {
  margin-top: 4px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--navy), var(--navy-mid));
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ucas-text { color: white; font-size: 13px; font-weight: 600; }
.ucas-text strong { display: block; font-size: 15px; margin-bottom: 2px; }
.ucas-text span { color: rgba(255,255,255,0.6); font-size: 12px; }

.ucas-btn {
  padding: 9px 20px;
  background: var(--amber);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.ucas-btn:hover { background: var(--amber-light); }
.ucas-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* Footer */
.offers-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--cream-border);
  flex-shrink: 0;
}

.offers-secondary,
.offers-primary {
  border: 1.5px solid var(--cream-border);
  border-radius: 20px;
  padding: 9px 14px;
  font-weight: 800;
  cursor: pointer;
  font-size: 12.5px;
}

.offers-secondary {
  background: white;
  color: var(--navy-mid);
}
.offers-secondary:hover { border-color: var(--navy-mid); }

.offers-primary {
  background: var(--amber);
  color: white;
  border-color: var(--amber);
}
.offers-primary:hover { background: var(--amber-light); border-color: var(--amber-light); }
.offers-primary:disabled { opacity: 0.7; cursor: not-allowed; }

/* Responsive */
@media (max-width: 900px) {
  .ai-sidebar { width: 280px; }
  .edit-grid { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
  .ai-sidebar { display: none; }
  .student-pill { display: none; }
  .modal-header { padding: 16px 16px 0; }
  .chat-messages { padding: 14px 16px; }
  .chat-input-row { padding: 12px 14px; }
  .search-top { padding: 14px 16px; }
  .search-results { padding: 12px 16px; }
  .manual-layout { padding: 16px; }
}

/* Data source indicator */
/* Data source indicator - subtle dot */
.data-source-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: help;
  z-index: 10;
}

.data-source-dot.live-source {
  background: #4caf50; /* Green dot for live Supabase data */
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

.data-source-dot.fallback-source {
  background: #ff9800; /* Orange dot for Knack fallback */
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.6);
}

/* Saving overlay */
.saving-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.saving-overlay p {
  color: white;
  font-size: 18px;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}
</style>

