<template>
  <div
    class="ucas-overlay"
    :class="[{ 'ucas-overlay--fullscreen': fullscreen }, embedded ? 'ucas-overlay--embedded' : '']"
    role="dialog"
    aria-modal="true"
    aria-label="UCAS Application"
    @click.self="embedded ? null : emit('close')"
  >
    <div class="ucas-modal" :class="{ 'ucas-modal--fullscreen': fullscreen }">
      <template v-if="!embedded">
        <button
          class="ucas-btn-close ucas-btn-close--corner ucas-btn-close--corner-secondary"
          type="button"
          @click="toggleFullscreen"
          :aria-label="fullscreen ? 'Exit full screen' : 'Full screen UCAS application'"
          :title="fullscreen ? 'Exit full screen' : 'Full screen'"
        >
          <svg v-if="!fullscreen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H3v6"/><path d="M15 21h6v-6"/><path d="M3 3l7 7"/><path d="M21 21l-7-7"/></svg>
        </button>
        <button class="ucas-btn-close ucas-btn-close--corner" type="button" @click="emit('close')" aria-label="Close UCAS application">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </template>
      <header class="ucas-header">
        <div class="ucas-header-left">
          <div class="ucas-title">UCAS Application</div>
          <div class="ucas-course-row">
            <label class="ucas-course-label" for="course-select">Course</label>
            <select id="course-select" v-model="selectedCourseKey" class="ucas-select" :disabled="courseOptions.length === 0">
              <option v-if="courseOptions.length === 0" value="">No offers yet</option>
              <option v-for="c in courseOptions" :key="c.key" :value="c.key">
                #{{ c.ranking }} {{ c.universityName }} — {{ c.courseTitle || 'Course' }}
              </option>
            </select>
            <a
              v-if="selectedCourse?.courseLink"
              class="ucas-btn ucas-btn-outline"
              :href="selectedCourse.courseLink"
              target="_blank"
              rel="noopener noreferrer"
              title="Open course link in a new tab"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Course link
            </a>

            <div class="ucas-course-meta" v-if="selectedCourse">
              <div
                v-if="selectedCourse.offer"
                class="ucas-meta-pill"
                :title="`Course offer requirement (grade): ${selectedCourse.offer}`"
              >
                <span class="ucas-meta-label">Required grade</span>
                <span class="ucas-meta-value">{{ selectedCourse.offer }}</span>
              </div>
              <div
                v-if="selectedCourse.ucasPoints !== null && selectedCourse.ucasPoints !== undefined && selectedCourse.ucasPoints !== ''"
                class="ucas-meta-pill"
                :title="`Course offer requirement (UCAS points): ${selectedCourse.ucasPoints}`"
              >
                <span class="ucas-meta-label">Required UCAS</span>
                <span class="ucas-meta-value">{{ selectedCourse.ucasPoints }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ucas-header-right">
          <!-- Teacher Reference quick bar -->
          <div v-if="canEdit" class="ucas-refbar">
            <button
              class="ucas-refbar-btn"
              type="button"
              @click="refPanelOpen = true"
              :disabled="refLoading || !studentEmail || !apiUrl"
              title="Invite a teacher and track reference progress"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12Z"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M19 8h2"/><path d="M20 7v2"/></svg>
              Teacher reference
            </button>
            <span class="ucas-refbar-pill" :class="`ucas-refbar--${referenceStatus}`">
              {{ referenceStatusLabel }}
              <span v-if="inviteCounts.total" class="ucas-refbar-count">
                ({{ inviteCounts.submitted }}/{{ inviteCounts.total }})
              </span>
            </span>
          </div>
          <div v-else class="ucas-refbar">
            <button
              class="ucas-refbar-btn"
              type="button"
              @click="refPanelOpen = true"
              :disabled="refLoading || !studentEmail || !apiUrl"
              title="View teacher reference"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12Z"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
              Teacher reference
            </button>
            <span class="ucas-refbar-pill" :class="`ucas-refbar--${referenceStatus}`">{{ referenceStatusLabel }}</span>
          </div>

          <a
            class="ucas-btn ucas-btn-outline"
            href="https://www.ucas.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open UCAS in a new tab"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            UCAS
          </a>
          <button
            class="ucas-btn ucas-btn-feedback"
            type="button"
            @click="openFeedback"
            :disabled="!canEdit || feedbackLoading || !studentEmail || !apiUrl"
            :title="!canEdit ? 'Available for students' : 'Get feedback to improve your statement'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>
            Get Feedback
          </button>
          <button class="ucas-btn ucas-btn-outline" type="button" @click="copyCombined" :disabled="!combinedStatement">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copy
          </button>
          <button
            v-if="canEdit"
            class="ucas-btn ucas-btn-outline"
            type="button"
            @click="markStatementComplete"
            :disabled="statementMarking || !!statementCompletedAt || totalChars > MAX_TOTAL_CHARS || totalChars < MIN_TOTAL_CHARS || !studentEmail"
            :title="statementCompletedAt ? 'Already marked complete' : 'Mark your personal statement complete and notify staff'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            {{ statementCompletedAt ? 'Statement complete' : 'Mark statement complete' }}
          </button>
          <button
            class="ucas-btn ucas-btn-primary"
            type="button"
            @click="saveToServer"
            :disabled="!canEdit || saving || !studentEmail"
            :title="!canEdit ? 'Read-only for staff — students can save' : 'Save UCAS application'"
          >
            <svg v-if="!saving" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span v-if="saving" class="ucas-spinner"></span>
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </header>

      <main class="ucas-body">
        <section class="ucas-top-grid">
          <div class="ucas-card">
            <div class="ucas-card-header">
              <h2 class="ucas-card-title">Subjects + offer requirements</h2>
              <p class="ucas-card-hint">Enter the grades required by the university for this course (max 5 subjects).</p>
            </div>

            <div v-if="subjectRows.length === 0" class="ucas-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
              <span>No subjects found in the academic profile.</span>
            </div>
            <div v-else class="ucas-subjects-grid">
              <div class="ucas-subjects-head">Subject</div>
              <div class="ucas-subjects-head">Offer grade</div>
              <template v-for="s in subjectRows" :key="s.key">
                <div class="ucas-subject-name" :title="s.label">{{ s.label }}</div>
                <div>
                  <input
                    class="ucas-input"
                    type="text"
                    :disabled="!canEdit"
                    :value="currentCourseSubjectOffers[s.key] || ''"
                    @click="notifyReadOnlyEdit"
                    @focus="notifyReadOnlyEdit"
                    @input="(e) => setSubjectOffer(s.key, e.target.value)"
                    placeholder="e.g. AAA"
                  />
                </div>
              </template>
            </div>

            <!-- UCAS Points Calculator (estimated) -->
            <div class="ucas-tariff" v-if="subjectRows.length">
              <div class="ucas-preview-header">
                <h3 class="ucas-preview-title">UCAS points (estimated)</h3>
                <span class="ucas-preview-hint">Based on the subjects shown (max 5)</span>
              </div>
              <div class="ucas-tariff-grid">
                <div
                  class="ucas-tariff-box"
                  :class="ucasTariffBoxClass(ucasTariff.current, ucasTariff.required)"
                  :title="ucasTariffTooltip('Current', 'Calculated from Current grades shown in your Academic Profile.', ucasTariff.current, ucasTariff.required)"
                >
                  <div class="ucas-tariff-label">Current</div>
                  <div class="ucas-tariff-value">{{ ucasTariff.current.toLocaleString() }}</div>
                  <div class="ucas-tariff-sub">Grades: <span class="ucas-tariff-sub-val">{{ ucasTariffGrades.current || '—' }}</span></div>
                </div>
                <div
                  class="ucas-tariff-box"
                  :class="ucasTariffBoxClass(ucasTariff.target, ucasTariff.required)"
                  :title="ucasTariffTooltip('Target', 'Calculated from Target grades shown in your Academic Profile.', ucasTariff.target, ucasTariff.required)"
                >
                  <div class="ucas-tariff-label">Target</div>
                  <div class="ucas-tariff-value">{{ ucasTariff.target.toLocaleString() }}</div>
                  <div class="ucas-tariff-sub">Grades: <span class="ucas-tariff-sub-val">{{ ucasTariffGrades.target || '—' }}</span></div>
                </div>
                <div
                  class="ucas-tariff-box ucas-tariff-box--required"
                  :title="ucasTariffTooltip('Required', 'Calculated from the Offer grade inputs on this page (per subject).', ucasTariff.required, ucasTariff.required)"
                >
                  <div class="ucas-tariff-label">Required</div>
                  <div class="ucas-tariff-value">{{ ucasTariff.required.toLocaleString() }}</div>
                  <div class="ucas-tariff-sub">Grades: <span class="ucas-tariff-sub-val">{{ ucasTariffGrades.required || '—' }}</span></div>
                </div>
              </div>
              <div v-if="ucasTariff.unknownCount > 0" class="ucas-tariff-note">
                Some grades couldn’t be converted to points (format/qualification not recognised).
              </div>
            </div>
          </div>

          <div class="ucas-card">
            <div class="ucas-card-header">
              <h2 class="ucas-card-title">Character budget</h2>
            </div>

            <div class="ucas-metrics">
              <div class="ucas-metric" :class="{ 'ucas-metric--danger': totalChars >= MAX_TOTAL_CHARS }">
                <div class="ucas-metric-label">Total characters</div>
                <div class="ucas-metric-value">
                  {{ totalChars.toLocaleString() }} <span class="ucas-metric-max">/ {{ MAX_TOTAL_CHARS.toLocaleString() }}</span>
                </div>
                <div class="ucas-progress-bar">
                  <div
                    class="ucas-progress-fill"
                    :style="{ width: Math.min(100, (totalChars / MAX_TOTAL_CHARS) * 100) + '%' }"
                    :class="{
                      'ucas-progress--warning': totalChars > MAX_TOTAL_CHARS * 0.85,
                      'ucas-progress--danger': totalChars >= MAX_TOTAL_CHARS
                    }"
                  ></div>
                </div>
                <div class="ucas-metric-sub" :class="{ 'ucas-metric-sub--danger': overChars > 0 }">
                  <template v-if="overChars > 0">{{ overChars.toLocaleString() }} over limit</template>
                  <template v-else>{{ remainingChars.toLocaleString() }} remaining</template>
                </div>
              </div>
              <div class="ucas-metric" :class="{ 'ucas-metric--success': totalChars >= MIN_TOTAL_CHARS }">
                <div class="ucas-metric-label">Minimum required</div>
                <div class="ucas-metric-value">{{ MIN_TOTAL_CHARS }} <span class="ucas-metric-max">characters</span></div>
                <div class="ucas-metric-status">
                  <svg v-if="totalChars >= MIN_TOTAL_CHARS" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{{ totalChars >= MIN_TOTAL_CHARS ? 'Minimum met' : `Need ${MIN_TOTAL_CHARS - totalChars} more` }}</span>
                </div>
              </div>
            </div>

            <div class="ucas-preview">
              <div class="ucas-preview-header">
                <h3 class="ucas-preview-title">Preview</h3>
                <span class="ucas-preview-hint">Combined statement as it will appear</span>
                <button class="ucas-q-expand" type="button" @click="openExpanded('preview')" title="Expand preview to read comfortably">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                  Expand
                </button>
              </div>
              <div class="ucas-preview-box">{{ combinedStatement || 'Your combined statement will appear here as you type…' }}</div>
            </div>
          </div>
        </section>

        <section class="ucas-questions">
          <div class="ucas-q">
            <div class="ucas-q-header">
              <label class="ucas-q-label" for="q1">
                <span class="ucas-q-number">1</span>
                <span class="ucas-q-title">Why do you want to study this course or subject?</span>
              </label>
              <div class="ucas-q-actions">
                <button class="ucas-q-expand" type="button" @click="openExpanded('q1')" :title="canEdit ? 'Expand for focused writing' : 'Expand to read comfortably'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                  Expand
                </button>
                <span class="ucas-q-count" :class="{ 'ucas-q-count--active': answers.q1.length > 0 }">
                  {{ answers.q1.length.toLocaleString() }} chars
                </span>
              </div>
            </div>
            <textarea
              id="q1"
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q1"
              @click="notifyReadOnlyEdit"
              @focus="notifyReadOnlyEdit"
              @input="(e) => handleAnswerInput('q1', e.target.value)"
              placeholder="Be specific. What sparked your interest, and why this course?"
            />
          </div>

          <div class="ucas-q">
            <div class="ucas-q-header">
              <label class="ucas-q-label" for="q2">
                <span class="ucas-q-number">2</span>
                <span class="ucas-q-title">How have your qualifications and studies prepared you?</span>
              </label>
              <div class="ucas-q-actions">
                <button class="ucas-q-expand" type="button" @click="openExpanded('q2')" :title="canEdit ? 'Expand for focused writing' : 'Expand to read comfortably'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                  Expand
                </button>
                <span class="ucas-q-count" :class="{ 'ucas-q-count--active': answers.q2.length > 0 }">
                  {{ answers.q2.length.toLocaleString() }} chars
                </span>
              </div>
            </div>
            <textarea
              id="q2"
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q2"
              @click="notifyReadOnlyEdit"
              @focus="notifyReadOnlyEdit"
              @input="(e) => handleAnswerInput('q2', e.target.value)"
              placeholder="Use evidence: topics, projects, what you learned, and how it links."
            />
          </div>

          <div class="ucas-q">
            <div class="ucas-q-header">
              <label class="ucas-q-label" for="q3">
                <span class="ucas-q-number">3</span>
                <span class="ucas-q-title">What have you done outside education to prepare, and why is it useful?</span>
              </label>
              <div class="ucas-q-actions">
                <button class="ucas-q-expand" type="button" @click="openExpanded('q3')" :title="canEdit ? 'Expand for focused writing' : 'Expand to read comfortably'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                  Expand
                </button>
                <span class="ucas-q-count" :class="{ 'ucas-q-count--active': answers.q3.length > 0 }">
                  {{ answers.q3.length.toLocaleString() }} chars
                </span>
              </div>
            </div>
            <textarea
              id="q3"
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q3"
              @click="notifyReadOnlyEdit"
              @focus="notifyReadOnlyEdit"
              @input="(e) => handleAnswerInput('q3', e.target.value)"
              placeholder="Super-curricular, work experience, reading, volunteering, clubs… what did it develop?"
            />
          </div>
        </section>

        <section v-if="commentsEnabled" class="ucas-comments">
          <div class="ucas-comments-shell">
            <div class="ucas-comments-header">
              <div class="ucas-comments-header-left">
                <div class="ucas-comments-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div class="ucas-comments-title-group">
                  <h2 class="ucas-comments-title">Tutor feedback</h2>
                  <p class="ucas-comments-subtitle">Comments from staff to help improve your statement</p>
                </div>
              </div>
              <div class="ucas-comments-count" :title="`${(staffComments || []).length} comment(s)`">
                <span class="ucas-comments-count-num">{{ (staffComments || []).length }}</span>
                <span>Comments</span>
              </div>
            </div>

            <!-- Compose (staff view only) -->
            <div v-if="canAddComment" class="ucas-comments-compose">
              <div class="ucas-comments-compose-row">
                <div class="ucas-comments-avatar ucas-comments-avatar--compose">
                  {{ commentInitialsFromText(staffEmail || 'Staff') }}
                </div>
                <div class="ucas-comments-compose-main">
                  <textarea
                    v-model="newComment"
                    class="ucas-comments-textarea"
                    placeholder="Write feedback for this student's personal statement…"
                    :disabled="commentSaving"
                  />
                  <div class="ucas-comments-compose-footer">
                    <div class="ucas-comments-compose-hint">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <span>Visible to the student immediately</span>
                    </div>
                    <div class="ucas-comments-compose-actions">
                      <button class="ucas-btn ucas-btn-ghost" type="button" @click="newComment = ''" :disabled="commentSaving || !newComment">
                        Cancel
                      </button>
                      <button class="ucas-btn ucas-btn-primary" type="button" @click="submitComment" :disabled="commentSaving || !newComment.trim()">
                        <svg v-if="!commentSaving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="m22 2-7 20-4-9-9-4 20-7z" />
                          <path d="M22 2 11 13" />
                        </svg>
                        {{ commentSaving ? 'Posting…' : 'Post feedback' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ucas-comments-quick">
                <div class="ucas-comments-quick-label">Quick feedback</div>
                <div class="ucas-comments-quick-chips">
                  <button v-for="t in QUICK_COMMENT_CHIPS" :key="t" class="ucas-comments-chip" type="button" @click="applyQuickChip(t)" :disabled="commentSaving">
                    {{ t }}
                  </button>
                </div>
              </div>
            </div>

            <!-- List -->
            <div v-if="groupedStaffComments.length === 0" class="ucas-comments-empty">
              <div class="ucas-comments-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div class="ucas-comments-empty-title">No feedback yet</div>
              <div class="ucas-comments-empty-text">Staff comments will appear here to help improve your personal statement.</div>
            </div>
            <div v-else class="ucas-comments-list">
              <template v-for="g in groupedStaffComments" :key="g.key">
                <div class="ucas-comments-divider" :aria-label="g.label">
                  <div class="ucas-comments-divider-line"></div>
                  <span class="ucas-comments-divider-text">{{ g.label }}</span>
                  <div class="ucas-comments-divider-line"></div>
                </div>

                <div v-for="c in g.items" :key="c.id" class="ucas-comments-item">
                  <div class="ucas-comments-item-main">
                    <div class="ucas-comments-avatar" :class="commentAvatarClass(c.staffEmail)">
                      {{ commentInitialsFromText(c.staffEmail || 'Staff') }}
                    </div>
                    <div class="ucas-comments-item-content">
                      <div class="ucas-comments-item-header">
                        <div class="ucas-comments-item-author">
                          <span class="ucas-comments-author">{{ c.staffEmail || 'Staff' }}</span>
                          <span v-if="safeText(c.staffEmail).trim().toLowerCase() === 'virtual tutor'" class="ucas-comments-role">
                            Virtual Tutor
                          </span>
                        </div>
                        <span class="ucas-comments-date">{{ formatDate(c.createdAt) }}</span>
                      </div>

                      <div class="ucas-comments-body" :class="{ 'ucas-comments-body--collapsed': !isCommentExpanded(c.id) && (safeText(c.comment).length > COMMENT_COLLAPSE_AT) }">
                        <template v-if="isCommentExpanded(c.id)">{{ c.comment }}</template>
                        <template v-else>{{ commentPreview(c.comment) }}</template>
                      </div>

                      <button
                        v-if="safeText(c.comment).length > COMMENT_COLLAPSE_AT"
                        class="ucas-comments-more"
                        type="button"
                        @click="toggleCommentExpanded(c.id)"
                      >
                        {{ isCommentExpanded(c.id) ? 'Show less' : 'Show more' }}
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </section>
      </main>

      <footer class="ucas-footer">
        <div class="ucas-footer-left">
          <div class="ucas-footer-stats">
            <span class="ucas-footer-total">{{ totalChars.toLocaleString() }}</span>
            <span class="ucas-footer-divider">/</span>
            <span class="ucas-footer-max">{{ MAX_TOTAL_CHARS.toLocaleString() }}</span>
            <span class="ucas-footer-remaining">
              (
              <template v-if="overChars > 0">{{ overChars.toLocaleString() }} over</template>
              <template v-else>{{ remainingChars.toLocaleString() }} remaining</template>
              )
            </span>
          </div>
          <div v-if="totalChars > 0 && totalChars < MIN_TOTAL_CHARS" class="ucas-footer-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Add {{ MIN_TOTAL_CHARS - totalChars }} more characters to reach the minimum.
          </div>
          <div v-if="totalChars > MAX_TOTAL_CHARS" class="ucas-footer-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Over the limit by {{ overChars }} characters. Shorten your statement before saving or marking complete.
          </div>
          <div v-else-if="totalChars >= MAX_TOTAL_CHARS" class="ucas-footer-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Maximum character limit reached.
          </div>
        </div>
        <div class="ucas-footer-right">
          <transition name="toast-fade">
            <span v-if="toast" class="ucas-toast">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {{ toast }}
            </span>
          </transition>
        </div>
      </footer>

      <!-- Feedback popup (student-only; no "AI" wording) -->
      <div v-if="feedbackOpen" class="ucas-feedback-overlay" @click.self="feedbackOpen = false">
        <div class="ucas-feedback-modal" role="dialog" aria-modal="true" aria-label="Feedback">
          <div class="ucas-feedback-header">
            <div class="ucas-feedback-title">Feedback</div>
            <button class="ucas-btn-close" type="button" @click="feedbackOpen = false" aria-label="Close feedback">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ucas-feedback-body">
            <div v-if="feedbackLoading" class="ucas-feedback-loading">
              <span class="ucas-spinner"></span>
              Generating feedback…
            </div>
            <div v-else-if="feedbackError" class="ucas-feedback-error">
              {{ feedbackError }}
            </div>
            <div v-else class="ucas-feedback-text">
              {{ feedbackText || 'No feedback available yet.' }}
            </div>
          </div>
          <div class="ucas-feedback-footer">
            <button class="ucas-btn ucas-btn-outline" type="button" @click="openFeedback(true)" :disabled="feedbackLoading">
              Regenerate
            </button>
            <button
              class="ucas-btn ucas-btn-primary"
              type="button"
              @click="addFeedbackAsComment"
              :disabled="feedbackLoading || feedbackAdding || !feedbackText"
              :title="!feedbackText ? 'Generate feedback first' : 'Add this feedback into Tutor comments as Virtual Tutor'"
            >
              {{ feedbackAdding ? 'Adding…' : 'Add as a comment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded writing overlay (mobile-friendly full screen) -->
      <div v-if="expandedOpen" class="ucas-expand-overlay" @click.self="closeExpanded">
        <div class="ucas-expand-modal" role="dialog" aria-modal="true" aria-label="Expanded writing">
          <div class="ucas-expand-header">
            <div class="ucas-expand-title">{{ expandedTitle }}</div>
            <div class="ucas-expand-meta">
              <span class="ucas-expand-pill">{{ expandedChars.toLocaleString() }} in this section</span>
              <span class="ucas-expand-pill">{{ totalChars.toLocaleString() }}/{{ MAX_TOTAL_CHARS.toLocaleString() }} total</span>
            </div>
            <button class="ucas-btn-close" type="button" @click="closeExpanded" aria-label="Close expanded writing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ucas-expand-body">
            <div v-if="expandedField === 'preview'" class="ucas-preview-box ucas-preview-box--expanded">
              {{ expandedValue || 'Your combined statement will appear here as you type…' }}
            </div>
            <textarea
              v-else
              ref="expandedTextareaEl"
              class="ucas-textarea ucas-textarea-expanded"
              :disabled="!canEdit"
              :value="expandedValue"
              @input="(e) => handleAnswerInput(expandedField, e.target.value)"
            />
          </div>
          <div class="ucas-expand-footer">
            <div class="ucas-expand-hint">
              Tip: write freely here, then close to see the full page again.
            </div>
            <button class="ucas-btn ucas-btn-primary" type="button" @click="closeExpanded">Done</button>
          </div>
        </div>
      </div>

      <!-- Expanded writing overlay (staff reference sections 2/3) -->
      <div v-if="refExpandedOpen" class="ucas-expand-overlay" @click.self="closeRefExpanded">
        <div class="ucas-expand-modal" role="dialog" aria-modal="true" aria-label="Expanded reference writing">
          <div class="ucas-expand-header">
            <div class="ucas-expand-title">{{ refExpandedTitle }}</div>
            <div class="ucas-expand-meta">
              <span class="ucas-expand-pill">{{ refExpandedChars.toLocaleString() }} characters</span>
            </div>
            <button class="ucas-btn-close" type="button" @click="closeRefExpanded" aria-label="Close expanded writing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ucas-expand-body">
            <textarea
              ref="refExpandedTextareaEl"
              class="ucas-textarea ucas-textarea-expanded"
              :disabled="!staffCanSave"
              :value="refExpandedValue"
              @input="(e) => { refExpandedTarget === 'staff2' ? (staffSection2Text = e.target.value) : (staffSection3Text = e.target.value) }"
            />
          </div>
          <div class="ucas-expand-footer">
            <div class="ucas-expand-hint">
              Tip: write freely here, then close to return to the reference panel.
            </div>
            <button class="ucas-btn ucas-btn-primary" type="button" @click="closeRefExpanded">Done</button>
          </div>
        </div>
      </div>

      <!-- Teacher reference panel (students only; no reference content) -->
      <div v-if="refPanelOpen" class="ucas-feedback-overlay" @click.self="refPanelOpen = false">
        <div class="ucas-feedback-modal ucas-ref-modal" role="dialog" aria-modal="true" aria-label="Teacher reference">
          <div class="ucas-ref-header">
            <div class="ucas-ref-header-left">
              <div class="ucas-ref-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    v-if="canEdit"
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  />
                  <circle v-if="canEdit" cx="9" cy="7" r="4" />
                  <path v-if="canEdit" d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path v-if="canEdit" d="M16 3.13a4 4 0 0 1 0 7.75" />

                  <path
                    v-else
                    d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                  />
                  <polyline v-if="!canEdit" points="14 2 14 8 20 8" />
                  <line v-if="!canEdit" x1="16" y1="13" x2="8" y2="13" />
                  <line v-if="!canEdit" x1="16" y1="17" x2="8" y2="17" />
                  <line v-if="!canEdit" x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div class="ucas-ref-title-group">
                <div class="ucas-ref-title">Teacher reference</div>
                <div class="ucas-ref-subtitle">
                  <span v-if="canEdit">Invite teachers to contribute to your UCAS reference</span>
                  <span v-else>View and add contributions (Sections 2 &amp; 3)</span>
                </div>
              </div>
            </div>
            <button class="ucas-ref-close" type="button" @click="refPanelOpen = false" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="ucas-ref-statusbar">
            <div class="ucas-ref-statusbar-left">
              <span class="ucas-ref-status-label">Reference status</span>
              <span class="ucas-ref-status-pill" :class="`ucas-ref-status--${referenceStatus}`">
                <svg
                  v-if="referenceStatus === 'completed' || referenceStatus === 'finalised'"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <svg
                  v-else
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ referenceStatusLabel }}
              </span>
              <span v-if="inviteCounts.total" class="ucas-ref-status-count">{{ inviteCounts.submitted }}/{{ inviteCounts.total }} submitted</span>
              <span v-else class="ucas-ref-status-count">No invites yet</span>
            </div>
            <button class="ucas-ref-refresh" type="button" @click="loadReferenceStatus" :disabled="refLoading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              {{ refLoading ? 'Refreshing…' : 'Refresh' }}
            </button>
          </div>

          <div class="ucas-ref-body">
            <div v-if="canEdit" class="ucas-ref-student">
              <div class="ucas-ref-steps">
                <div class="ucas-ref-step">
                  <div class="ucas-ref-step-circle" :class="{ complete: inviteCounts.total > 0 }">
                    <svg v-if="inviteCounts.total > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span v-else>1</span>
                  </div>
                  <div class="ucas-ref-step-label">Invite teachers</div>
                </div>
                <div class="ucas-ref-step">
                  <div class="ucas-ref-step-circle" :class="{ active: inviteCounts.total > 0 && inviteCounts.submitted < inviteCounts.total, complete: inviteCounts.total > 0 && inviteCounts.submitted === inviteCounts.total }">
                    <span>2</span>
                  </div>
                  <div class="ucas-ref-step-label" :class="{ active: inviteCounts.total > 0 && inviteCounts.submitted < inviteCounts.total }">Awaiting responses</div>
                </div>
                <div class="ucas-ref-step">
                  <div class="ucas-ref-step-circle" :class="{ complete: referenceStatus === 'completed' || referenceStatus === 'finalised' }">
                    <svg v-if="referenceStatus === 'completed' || referenceStatus === 'finalised'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span v-else>3</span>
                  </div>
                  <div class="ucas-ref-step-label">Reference complete</div>
                </div>
              </div>

              <div class="ucas-ref-section">
                <div class="ucas-ref-section-head">
                  <div>
                    <div class="ucas-ref-section-title">Invited teachers</div>
                    <div class="ucas-ref-section-subtitle">Track who has been asked to contribute</div>
                  </div>
                  <div class="ucas-ref-section-pill">{{ (visibleReferenceInvites || []).length }} invited</div>
                </div>

                <div v-if="visibleReferenceInvites.length === 0" class="ucas-ref-empty">
                  <div class="ucas-ref-empty-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="ucas-ref-empty-title">No invitations yet</div>
                    <div class="ucas-ref-empty-text">Invite a teacher below to get started.</div>
                  </div>
                </div>

                <div v-else class="ucas-ref-invite-list">
                  <div v-for="inv in visibleReferenceInvites" :key="inv.id" class="ucas-ref-invite" :class="{ submitted: inv.status === 'submitted' }">
                    <div class="ucas-ref-invite-left">
                      <div class="ucas-ref-invite-avatar" :class="commentAvatarClass(inv.teacherEmail)">
                        {{ commentInitialsFromText(inv.teacherName || inv.teacherEmail) }}
                      </div>
                      <div class="ucas-ref-invite-meta">
                        <div class="ucas-ref-invite-name">{{ inv.teacherName || inv.teacherEmail }}</div>
                        <div class="ucas-ref-invite-sub">{{ inv.subjectKey || 'No subject' }}</div>
                      </div>
                    </div>
                    <div class="ucas-ref-invite-actions">
                      <button class="ucas-ref-invite-action" type="button" @click="reinvite(inv)" :disabled="refInviteSending">
                        Reinvite
                      </button>
                      <button class="ucas-ref-invite-action ucas-ref-invite-action--danger" type="button" @click="hideInvite(inv)">
                        Remove
                      </button>
                    </div>
                    <div class="ucas-ref-invite-status" :class="inv.status === 'submitted' ? 'ok' : 'wait'">
                      <svg
                        v-if="inv.status === 'submitted'"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <svg
                        v-else
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {{ inv.status === 'submitted' ? 'Submitted' : 'Pending' }}
                    </div>
                  </div>
                </div>

                <div v-if="hiddenInviteIds.size" class="ucas-ref-hidden-row">
                  <span class="hint">{{ hiddenInviteIds.size }} removed from list</span>
                  <button class="ucas-btn ucas-btn-ghost" type="button" @click="restoreAllInvites">Restore</button>
                </div>
              </div>

              <div class="ucas-ref-section ucas-ref-section--form">
                <div class="ucas-ref-form-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Invite another teacher
                </div>

                <div class="ucas-ref-form-grid">
                  <div>
                    <div class="ucas-ref-label">Teacher email</div>
                    <input class="ucas-ref-input" type="email" v-model="inviteEmail" placeholder="teacher@school.org" />
                  </div>
                  <div>
                    <div class="ucas-ref-label">Subject (optional)</div>
                    <select class="ucas-ref-select" v-model="inviteSubjectKey">
                      <option value="">No subject</option>
                      <option v-for="s in subjectRows" :key="s.key" :value="s.label">{{ s.label }}</option>
                    </select>
                  </div>
                </div>

                <div class="ucas-ref-form-actions">
                  <button class="ucas-btn ucas-btn-outline" type="button" @click="inviteEmail=''; inviteSubjectKey=''" :disabled="refInviteSending">
                    Clear
                  </button>
                  <button class="ucas-btn ucas-btn-primary" type="button" @click="sendInvite" :disabled="refInviteSending || !inviteEmail.trim()">
                    <svg v-if="!refInviteSending" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m22 2-7 20-4-9-9-4 20-7z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    {{ refInviteSending ? 'Sending…' : 'Send invitation' }}
                  </button>
                </div>

                <div v-if="lastInviteUrl" class="ucas-ref-linkcopy">
                  <div class="ucas-ref-linkcopy-label">Or copy invite link</div>
                  <div class="ucas-ref-linkcopy-row">
                    <input class="ucas-ref-linkcopy-input" type="text" :value="lastInviteUrl" readonly />
                    <button class="ucas-ref-linkcopy-btn" type="button" @click="copyText(lastInviteUrl)">Copy</button>
                  </div>
                  <div class="ucas-ref-linkcopy-hint">Share this link directly with your teacher if email doesn't arrive.</div>
                </div>
              </div>
            </div>

            <div v-else class="ucas-ref-staff">
              <div class="ucas-ref-staff-head">
                <div class="ucas-ref-staff-title">Reference (staff view)</div>
                <div class="ucas-ref-staff-meta" v-if="refFull && refFull.updatedAt">Updated {{ new Date(refFull.updatedAt).toLocaleString() }}</div>
              </div>

              <div v-if="refFullLoading" class="ucas-empty ucas-empty--small"><span>Loading reference…</span></div>
              <div v-else-if="!refFull" class="ucas-empty ucas-empty--small"><span>No reference data found.</span></div>
              <div v-else class="ucas-ref-staff-body">
                <!-- Editors -->
                <div class="ucas-ref-contrib">
                  <div class="ucas-ref-contrib-head">
                    <div class="ucas-ref-contrib-title">
                      <span class="ucas-ref-num">3</span>
                      Subject teacher contributions
                    </div>
                    <span class="ucas-ref-badge has-content">{{ (refFull.section3 || []).length }} contributions</span>
                  </div>
                  <div class="ucas-ref-contrib-sub">Add specific evidence of academic potential and engagement relevant to the course.</div>

                  <div class="ucas-ref-editor">
                    <div class="ucas-ref-editor-select">
                      <select class="ucas-ref-select" v-model="staffSection3SubjectKey">
                        <option value="">No subject</option>
                        <option v-for="s in subjectRows" :key="s.key" :value="s.label">{{ s.label }}</option>
                      </select>
                    </div>
                    <textarea class="ucas-ref-textarea" v-model="staffSection3Text" placeholder="Describe the student's ability, achievements, and potential in your subject…" />
                    <div class="ucas-ref-editor-footer">
                      <span class="ucas-ref-char">{{ (staffSection3Text || '').length.toLocaleString() }} characters</span>
                      <button class="ucas-btn ucas-btn-outline" type="button" @click="openRefExpanded('staff3')" :disabled="!staffCanSave">
                        Expand
                      </button>
                      <button class="ucas-btn ucas-btn-primary" type="button" @click="saveStaffContribution(3)" :disabled="staffSaving3 || !staffCanSave || !staffSection3Text.trim()">
                        <svg v-if="!staffSaving3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        {{ staffSaving3 ? 'Saving…' : 'Save Section 3' }}
                      </button>
                    </div>
                    <div v-if="!staffCanSave" class="hint">Saving is unavailable because your staff email is missing in this embedded context.</div>
                  </div>

                  <div class="ucas-ref-existing" v-if="(refFull.section3 || []).length">
                    <div class="ucas-ref-existing-title">Existing contributions</div>
                    <div class="ucas-ref-existing-list">
                      <div v-for="c in refFull.section3" :key="c.id" class="ucas-ref-existing-item">
                        <div class="ucas-ref-existing-meta">
                          <div class="ucas-ref-existing-author">
                            <div class="ucas-ref-existing-avatar">{{ commentInitialsFromText(c.authorName || c.authorEmail) }}</div>
                            <span class="ucas-ref-existing-name">{{ c.authorName || c.authorEmail }}</span>
                          </div>
                          <span class="ucas-ref-existing-subject">{{ c.subjectKey || '' }}</span>
                        </div>
                        <div class="ucas-ref-existing-text">{{ c.text }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="ucas-ref-contrib ucas-ref-contrib--accordion">
                  <button class="ucas-ref-accordion-head" type="button" @click="staffSection2Open = !staffSection2Open">
                    <div class="ucas-ref-contrib-title">
                      <span class="ucas-ref-num">2</span>
                      Extenuating circumstances
                    </div>
                    <div class="ucas-ref-accordion-right">
                      <span class="ucas-ref-badge">Optional</span>
                      <span class="ucas-ref-accordion-chevron">{{ staffSection2Open ? '▲' : '▼' }}</span>
                    </div>
                  </button>
                  <div v-if="staffSection2Open" class="ucas-ref-accordion-body">
                    <div class="ucas-ref-contrib-sub">Add factual, course-relevant context (with student permission).</div>
                    <div class="ucas-ref-editor">
                      <textarea class="ucas-ref-textarea" v-model="staffSection2Text" placeholder="Add any relevant extenuating circumstances here…" />
                      <div class="ucas-ref-editor-footer">
                        <span class="ucas-ref-char">{{ (staffSection2Text || '').length.toLocaleString() }} characters</span>
                        <button class="ucas-btn ucas-btn-outline" type="button" @click="openRefExpanded('staff2')" :disabled="!staffCanSave">
                          Expand
                        </button>
                        <button class="ucas-btn ucas-btn-primary" type="button" @click="saveStaffContribution(2)" :disabled="staffSaving2 || !staffCanSave || !staffSection2Text.trim()">
                          <svg v-if="!staffSaving2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                          {{ staffSaving2 ? 'Saving…' : 'Save Section 2' }}
                        </button>
                      </div>
                      <div v-if="!staffCanSave" class="hint">Saving is unavailable because your staff email is missing in this embedded context.</div>
                    </div>
                  </div>
                </div>

                <div class="ucas-ref-section">
                  <div class="ucas-ref-section-head">
                    <div>
                      <div class="ucas-ref-section-title">Section 1 — Centre statement</div>
                      <div class="ucas-ref-section-subtitle">Standard centre template (usually written once)</div>
                    </div>
                  </div>
                  <div class="ucas-ref-section-body">{{ safeText(refFull.section1Text) || 'No centre template yet.' }}</div>
                </div>

                <div class="ucas-ref-section">
                  <div class="ucas-ref-section-head">
                    <div>
                      <div class="ucas-ref-section-title">Section 2 — Extenuating circumstances</div>
                      <div class="ucas-ref-section-subtitle">Existing contributions</div>
                    </div>
                    <div class="ucas-ref-section-pill">{{ (refFull.section2 || []).length }}</div>
                  </div>
                  <div v-if="(refFull.section2 || []).length === 0" class="ucas-empty ucas-empty--small"><span>No contributions yet.</span></div>
                  <div v-else class="ucas-ref-contrib-list">
                    <div v-for="c in refFull.section2" :key="c.id" class="ucas-ref-contrib-item">
                      <div class="ucas-ref-contrib-meta">{{ c.authorName || c.authorEmail }} <span v-if="c.subjectKey">• {{ c.subjectKey }}</span></div>
                      <div class="ucas-ref-contrib-text">{{ c.text }}</div>
                    </div>
                  </div>
                </div>

                <div class="ucas-ref-section">
                  <div class="ucas-ref-section-head">
                    <div>
                      <div class="ucas-ref-section-title">Invited teachers</div>
                      <div class="ucas-ref-section-subtitle">Status of external invites</div>
                    </div>
                    <div class="ucas-ref-section-pill">{{ (visibleReferenceInvites || []).length }}</div>
                  </div>
                  <div v-if="visibleReferenceInvites.length === 0" class="ucas-empty ucas-empty--small"><span>No invitations yet.</span></div>
                  <div v-else class="ucas-ref-invite-list">
                    <div v-for="inv in visibleReferenceInvites" :key="inv.id" class="ucas-ref-invite" :class="{ submitted: inv.status === 'submitted' }">
                      <div class="ucas-ref-invite-left">
                        <div class="ucas-ref-invite-avatar" :class="commentAvatarClass(inv.teacherEmail)">
                          {{ commentInitialsFromText(inv.teacherName || inv.teacherEmail) }}
                        </div>
                        <div class="ucas-ref-invite-meta">
                          <div class="ucas-ref-invite-name">{{ inv.teacherName || inv.teacherEmail }}</div>
                          <div class="ucas-ref-invite-sub">{{ inv.subjectKey || 'No subject' }}</div>
                        </div>
                      </div>
                      <div class="ucas-ref-invite-actions">
                        <button class="ucas-ref-invite-action" type="button" @click="reinvite(inv)" :disabled="refInviteSending">
                          Reinvite
                        </button>
                        <button class="ucas-ref-invite-action ucas-ref-invite-action--danger" type="button" @click="hideInvite(inv)">
                          Remove
                        </button>
                      </div>
                      <div class="ucas-ref-invite-status" :class="inv.status === 'submitted' ? 'ok' : 'wait'">
                        {{ inv.status === 'submitted' ? 'Submitted' : 'Pending' }}
                      </div>
                    </div>
                  </div>
                  <div v-if="hiddenInviteIds.size" class="ucas-ref-hidden-row">
                    <span class="hint">{{ hiddenInviteIds.size }} removed from list</span>
                    <button class="ucas-btn ucas-btn-ghost" type="button" @click="restoreAllInvites">Restore</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ucas-ref-footer">
            <button class="ucas-btn ucas-btn-primary" type="button" @click="refPanelOpen = false">Done</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { fetchUcasApplication, saveUcasApplication, addUcasApplicationComment, generateUcasFeedback, addVirtualTutorComment, fetchReferenceStatus, createReferenceInvite, fetchReferenceFull, saveReferenceContribution, markUcasStatementComplete } from '../services/api.js'

const MAX_TOTAL_CHARS = 4000
const MIN_TOTAL_CHARS = 350

const fullscreen = ref(false)
function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
}

const props = defineProps({
  studentEmail: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  subjects: { type: Array, default: () => [] },
  offers: { type: Array, default: () => [] },
  topOffer: { type: Object, default: null },
  apiUrl: { type: String, default: '' },
  canEdit: { type: Boolean, default: false },
  commentsEnabled: { type: Boolean, default: true },
  canAddComment: { type: Boolean, default: false },
  staffEmail: { type: String, default: '' },
  // When embedded, render as a normal container (no fixed overlay / no corner chrome)
  embedded: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function safeText(v) {
  return (v === null || v === undefined) ? '' : String(v)
}

function courseKeyForOffer(o) {
  const uni = safeText(o?.universityName).trim().toLowerCase()
  const course = safeText(o?.courseTitle).trim().toLowerCase()
  const link = safeText(o?.courseLink).trim().toLowerCase()
  return `${uni}|${course}|${link}`.replace(/\s+/g, ' ').trim()
}

const courseOptions = computed(() => {
  const list = Array.isArray(props.offers) ? props.offers : []
  const normalized = list.map((o) => ({
    key: courseKeyForOffer(o),
    ranking: o?.ranking ?? 1,
    universityName: safeText(o?.universityName).trim() || 'University',
    courseTitle: safeText(o?.courseTitle).trim(),
    courseLink: safeText(o?.courseLink).trim(),
    offer: safeText(o?.offer).trim(),
    ucasPoints: (o?.ucasPoints === null || o?.ucasPoints === undefined || String(o?.ucasPoints).trim() === '') ? null : Number(o?.ucasPoints)
  }))
  return normalized
    .filter((c) => c.key)
    .sort((a, b) => (Number(a.ranking) || 999) - (Number(b.ranking) || 999))
})

const selectedCourseKey = ref('')
const selectedCourse = computed(() => courseOptions.value.find(c => c.key === selectedCourseKey.value) || null)

const answers = reactive({ q1: '', q2: '', q3: '' })

// requirementsByCourse: { [courseKey]: { [subjectKey]: offerText } }
const requirementsByCourse = reactive({})

const staffComments = ref([])
const newComment = ref('')
const commentSaving = ref(false)

// Feedback (student-only)
const feedbackOpen = ref(false)
const feedbackLoading = ref(false)
const feedbackAdding = ref(false)
const feedbackText = ref('')
const feedbackError = ref('')

// Long comment UX (avoid huge blocks taking over the page)
const expandedCommentIds = ref(new Set())
const COMMENT_COLLAPSE_AT = 450

const QUICK_COMMENT_CHIPS = [
  '📝 Add more specific examples',
  '🔍 Strengthen your "why this course"',
  '✂️ Trim repetition',
  '💡 Show reflection, not just description',
  '🎯 Link skills to the course'
]

function isCommentExpanded(id) {
  return expandedCommentIds.value.has(String(id || ''))
}

function toggleCommentExpanded(id) {
  const key = String(id || '')
  const next = new Set(expandedCommentIds.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedCommentIds.value = next
}

function commentPreview(text) {
  const t = safeText(text)
  if (t.length <= COMMENT_COLLAPSE_AT) return t
  return t.slice(0, COMMENT_COLLAPSE_AT).trimEnd() + '…'
}

function applyQuickChip(text) {
  const t = safeText(text).trim()
  if (!t) return
  const current = safeText(newComment.value)
  const next = current ? (current.trimEnd() + '\n' + t) : t
  newComment.value = next
}

function commentInitialsFromText(text) {
  const raw = safeText(text).trim()
  if (!raw) return 'ST'
  const cleaned = raw.includes('@') ? raw.split('@')[0] : raw
  const parts = cleaned
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const first = (parts[0] || '').slice(0, 1)
  const second = (parts[1] || parts[0] || '').slice(1, 2)
  const out = (first + second).toUpperCase()
  return out || 'ST'
}

function commentAvatarClass(staffEmail) {
  const s = safeText(staffEmail).trim().toLowerCase()
  if (!s) return 'ucas-comments-avatar--blue'
  // simple stable hash → 0..3
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const n = h % 4
  if (n === 0) return 'ucas-comments-avatar--green'
  if (n === 1) return 'ucas-comments-avatar--blue'
  if (n === 2) return 'ucas-comments-avatar--purple'
  return 'ucas-comments-avatar--orange'
}

function dateKeyFromAny(v) {
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch (_) {
    return null
  }
}

function dateLabelFromKey(key) {
  try {
    if (!key) return ''
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayKey = `${y}-${m}-${d}`
    const dt = new Date(todayKey + 'T00:00:00')
    const dd = new Date(key + 'T00:00:00')
    const diffDays = Math.round((dt.getTime() - dd.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return dd.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (_) {
    return key
  }
}

const groupedStaffComments = computed(() => {
  const list = Array.isArray(staffComments.value) ? staffComments.value : []
  const groups = []
  let current = null
  for (const c of list) {
    const key = dateKeyFromAny(c?.createdAt) || 'unknown'
    if (!current || current.key !== key) {
      current = { key, label: key === 'unknown' ? 'Earlier' : dateLabelFromKey(key), items: [] }
      groups.push(current)
    }
    current.items.push(c)
  }
  return groups
})

// Teacher reference progress (student view: progress only)
const refLoading = ref(false)
const referenceStatus = ref('not_started')
const referenceInvites = ref([])
const hiddenInviteIds = ref(new Set())
const inviteEmail = ref('')
const inviteSubjectKey = ref('')
const refInviteSending = ref(false)
const lastInviteUrl = ref('')

const inviteStorageKey = computed(() => {
  const email = safeText(props.studentEmail).trim().toLowerCase()
  const year = safeText(props.academicYear).trim().toLowerCase()
  return `ucas_ref_hidden_invites:${email || 'unknown'}:${year || 'unknown'}`
})

function loadHiddenInvites() {
  try {
    const raw = localStorage.getItem(inviteStorageKey.value)
    if (!raw) {
      hiddenInviteIds.value = new Set()
      return
    }
    const arr = JSON.parse(raw)
    hiddenInviteIds.value = new Set(Array.isArray(arr) ? arr.map((x) => String(x)) : [])
  } catch (_) {
    hiddenInviteIds.value = new Set()
  }
}

function persistHiddenInvites() {
  try {
    localStorage.setItem(inviteStorageKey.value, JSON.stringify(Array.from(hiddenInviteIds.value)))
  } catch (_) {}
}

function hideInvite(inv) {
  try {
    const id = String(inv?.id || '')
    if (!id) return
    const next = new Set(hiddenInviteIds.value)
    next.add(id)
    hiddenInviteIds.value = next
    persistHiddenInvites()
    showToast('Invite removed from list')
  } catch (_) {}
}

function restoreAllInvites() {
  hiddenInviteIds.value = new Set()
  persistHiddenInvites()
  showToast('Restored hidden invites')
}

const visibleReferenceInvites = computed(() => {
  const list = Array.isArray(referenceInvites.value) ? referenceInvites.value : []
  const hidden = hiddenInviteIds.value
  const visible = list.filter((i) => i && !hidden.has(String(i.id || '')))

  // Collapse duplicates (same teacher + subject) to avoid invite lists growing endlessly.
  // Keep the most recent invite by createdAt/expiresAt/id ordering.
  const byKey = new Map()
  for (const inv of visible) {
    const teacher = safeText(inv?.teacherEmail || inv?.email).trim().toLowerCase()
    const subj = safeText(inv?.subjectKey).trim().toLowerCase()
    const key = `${teacher}__${subj}`
    const cur = byKey.get(key)
    if (!cur) {
      byKey.set(key, inv)
      continue
    }
    const curTs = Date.parse(cur?.createdAt || cur?.expiresAt || '') || 0
    const invTs = Date.parse(inv?.createdAt || inv?.expiresAt || '') || 0
    if (invTs > curTs) byKey.set(key, inv)
  }
  return Array.from(byKey.values())
})

const referenceStatusLabel = computed(() => {
  const s = referenceStatus.value
  if (s === 'finalised') return 'Finalised'
  if (s === 'completed') return 'Completed'
  if (s === 'in_progress') return 'In progress'
  return 'Not started'
})

const inviteCounts = computed(() => {
  const list = Array.isArray(visibleReferenceInvites.value) ? visibleReferenceInvites.value : []
  const total = list.length
  const submitted = list.filter(i => (i && i.status === 'submitted')).length
  return { total, submitted }
})

const refPanelOpen = ref(false)
const refFullLoading = ref(false)
const refFull = ref(null)

const staffCanSave = computed(() => {
  return !props.canEdit && !!safeText(props.staffEmail).trim() && !!safeText(props.apiUrl).trim() && !!safeText(props.studentEmail).trim()
})

const staffSection2Text = ref('')
const staffSection3SubjectKey = ref('')
const staffSection3Text = ref('')
const staffSaving2 = ref(false)
const staffSaving3 = ref(false)
const staffSection2Open = ref(false)

// Expanded writing for staff reference sections (2/3)
const refExpandedOpen = ref(false)
const refExpandedTarget = ref('staff3') // 'staff2' | 'staff3'
const refExpandedTextareaEl = ref(null)

const refExpandedTitle = computed(() => {
  if (refExpandedTarget.value === 'staff2') return 'Section 2: Extenuating circumstances'
  return 'Section 3: Subject teacher contribution'
})

const refExpandedValue = computed(() => {
  return refExpandedTarget.value === 'staff2' ? safeText(staffSection2Text.value) : safeText(staffSection3Text.value)
})

const refExpandedChars = computed(() => safeText(refExpandedValue.value).length)

function openRefExpanded(target) {
  if (!staffCanSave.value) return
  refExpandedTarget.value = target === 'staff2' ? 'staff2' : 'staff3'
  refExpandedOpen.value = true
  setTimeout(() => {
    try {
      refExpandedTextareaEl.value && refExpandedTextareaEl.value.focus && refExpandedTextareaEl.value.focus()
    } catch (_) {}
  }, 0)
}

function closeRefExpanded() {
  refExpandedOpen.value = false
}

function pickStaffContribution(section, subjectKey) {
  const staffEmail = safeText(props.staffEmail).trim().toLowerCase()
  if (!staffEmail) return null
  const full = refFull.value
  if (!full) return null
  const list = section === 2 ? (full.section2 || []) : (full.section3 || [])
  const normSubject = safeText(subjectKey || '').trim().toLowerCase()
  for (const c of (Array.isArray(list) ? list : [])) {
    if (!c) continue
    const a = safeText(c.authorEmail).trim().toLowerCase()
    if (a !== staffEmail) continue
    const s = safeText(c.subjectKey || '').trim().toLowerCase()
    if (section === 3) {
      if (s === normSubject) return c
    } else {
      // Section 2 is usually not subject-specific; accept the first match
      return c
    }
  }
  return null
}

async function saveStaffContribution(section) {
  if (!staffCanSave.value) return
  const sec = Number(section)
  if (sec !== 2 && sec !== 3) return
  const text = safeText(sec === 2 ? staffSection2Text.value : staffSection3Text.value)
  const trimmed = text.trim()
  if (!trimmed) return

  if (sec === 2) staffSaving2.value = true
  else staffSaving3.value = true

  try {
    const payload = {
      section: sec,
      text: trimmed,
      subjectKey: sec === 3 ? (safeText(staffSection3SubjectKey.value).trim() || null) : null,
      authorName: null,
      staffEmail: safeText(props.staffEmail).trim()
    }
    const resp = await saveReferenceContribution(props.studentEmail, payload, props.apiUrl, props.academicYear || null, { roleHint: 'staff' })
    if (!resp?.success) throw new Error(resp?.error || 'Save failed')
    showToast('Saved')
    await loadReferenceStatus()
  } catch (e) {
    showToast(e?.message || 'Save failed')
  } finally {
    if (sec === 2) staffSaving2.value = false
    else staffSaving3.value = false
  }
}

async function loadReferenceStatus() {
  if (!props.apiUrl || !props.studentEmail) return
  refLoading.value = true
  try {
    loadHiddenInvites()
    if (props.canEdit) {
      const resp = await fetchReferenceStatus(props.studentEmail, props.apiUrl, props.academicYear || null)
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load reference status')
      referenceStatus.value = safeText(resp?.data?.status || 'not_started')
      referenceInvites.value = Array.isArray(resp?.data?.invites) ? resp.data.invites : []
      return
    }

    refFullLoading.value = true
    const resp = await fetchReferenceFull(props.studentEmail, props.apiUrl, props.academicYear || null, { roleHint: 'staff' })
    if (!resp?.success) throw new Error(resp?.error || 'Failed to load reference')
    refFull.value = resp?.data || null
    referenceStatus.value = safeText(resp?.data?.status || 'not_started')
    referenceInvites.value = Array.isArray(resp?.data?.invites) ? resp.data.invites : []

    // Hydrate staff editor fields from existing contributions (if any)
    const c2 = pickStaffContribution(2, null)
    staffSection2Text.value = safeText(c2?.text || '')

    if (!safeText(staffSection3SubjectKey.value).trim() && subjectRows.value.length) {
      staffSection3SubjectKey.value = safeText(subjectRows.value[0]?.label || '')
    }
    const c3 = pickStaffContribution(3, staffSection3SubjectKey.value)
    staffSection3Text.value = safeText(c3?.text || '')
  } catch (e) {
    showToast(e?.message || 'Failed to load reference')
  } finally {
    refLoading.value = false
    refFullLoading.value = false
  }
}

watch(
  () => staffSection3SubjectKey.value,
  () => {
    const c3 = pickStaffContribution(3, staffSection3SubjectKey.value)
    staffSection3Text.value = safeText(c3?.text || '')
  }
)

watch(
  () => refPanelOpen.value,
  async (open) => {
    if (!open) return
    await loadReferenceStatus()
  }
)

async function sendInvite() {
  if (!props.canEdit || !props.apiUrl || !props.studentEmail) return
  const email = inviteEmail.value.trim()
  if (!email) return
  refInviteSending.value = true
  lastInviteUrl.value = ''
  try {
    const resp = await createReferenceInvite(
      props.studentEmail,
      {
        teacherEmail: email,
        subjectKey: inviteSubjectKey.value || null,
        allowedSections: [3]
      },
      props.apiUrl,
      props.academicYear || null,
      { roleHint: 'student' }
    )
    if (!resp?.success) throw new Error(resp?.error || 'Invite failed')
    // Prefer inbox link; if backend is old, transform contribution URL into inbox URL.
    const rawUrl = safeText(resp?.data?.inboxUrl || resp?.data?.inviteUrl || '')
    if (rawUrl.includes('/reference-contribution') && rawUrl.includes('token=')) {
      lastInviteUrl.value = rawUrl.replace('/reference-contribution', '/reference-inbox')
    } else {
      lastInviteUrl.value = rawUrl
    }
    showToast('Invite created')
    inviteEmail.value = ''
    inviteSubjectKey.value = ''
    await loadReferenceStatus()
  } catch (e) {
    showToast(e?.message || 'Invite failed')
  } finally {
    refInviteSending.value = false
  }
}

async function reinvite(inv) {
  if (!props.canEdit) return
  inviteEmail.value = safeText(inv?.teacherEmail || inv?.email || '').trim()
  inviteSubjectKey.value = safeText(inv?.subjectKey || '').trim()
  if (!inviteEmail.value) return
  await sendInvite()
}

function copyText(s) {
  try {
    navigator.clipboard.writeText(String(s || ''))
    showToast('Copied')
  } catch (_) {
    showToast('Copy failed')
  }
}

// Expanded writing (mobile friendly)
const expandedOpen = ref(false)
const expandedField = ref('q1') // 'q1'|'q2'|'q3'|'preview'
const expandedTextareaEl = ref(null)

const expandedTitle = computed(() => {
  if (expandedField.value === 'preview') return 'Preview: Combined statement'
  if (expandedField.value === 'q2') return 'Q2: How studies prepared you'
  if (expandedField.value === 'q3') return 'Q3: Outside education'
  return 'Q1: Why this course?'
})

const expandedValue = computed(() => {
  if (expandedField.value === 'preview') return combinedStatement.value || ''
  return answers[expandedField.value] || ''
})
const expandedChars = computed(() => expandedValue.value.length)

const lastReadOnlyToastAt = ref(0)
function notifyReadOnlyEdit() {
  if (props.canEdit) return
  const now = Date.now()
  if (now - lastReadOnlyToastAt.value < 1500) return
  lastReadOnlyToastAt.value = now
  showToast('Only students can edit their UCAS statement.')
}

function openExpanded(field) {
  expandedField.value = field
  expandedOpen.value = true
  // Focus textarea after render
  setTimeout(() => {
    try {
      if (expandedField.value !== 'preview' && props.canEdit) {
        expandedTextareaEl.value && expandedTextareaEl.value.focus && expandedTextareaEl.value.focus()
      }
    } catch (_) {}
  }, 0)
}

function closeExpanded() {
  expandedOpen.value = false
}

const subjectRows = computed(() => {
  const list = Array.isArray(props.subjects) ? props.subjects : []
  return list.slice(0, 5).map((s, idx) => {
    const key = safeText(s?.id || s?.originalRecordId || s?.position || s?.subjectName || `idx_${idx}`)
    const raw = safeText(s?.subjectName).trim() || 'Subject'
    const label = raw.replace(/^\s*(?:[a-z]{1,2}\d?\s*-\s*)+/i, '').trim() || raw
    return { key, label }
  })
})

const currentCourseSubjectOffers = computed(() => {
  const ck = selectedCourseKey.value || ''
  if (!ck) return {}
  return requirementsByCourse[ck] || {}
})

function setSubjectOffer(subjectKey, value) {
  if (!props.canEdit) return
  const ck = selectedCourseKey.value || ''
  if (!ck) return
  if (!requirementsByCourse[ck]) requirementsByCourse[ck] = {}
  requirementsByCourse[ck][subjectKey] = safeText(value).slice(0, 24)
}

const totalChars = computed(() => answers.q1.length + answers.q2.length + answers.q3.length)
const remainingChars = computed(() => Math.max(0, MAX_TOTAL_CHARS - totalChars.value))
const overChars = computed(() => Math.max(0, totalChars.value - MAX_TOTAL_CHARS))

const combinedStatement = computed(() => {
  const a = safeText(answers.q1).trim()
  const b = safeText(answers.q2).trim()
  const c = safeText(answers.q3).trim()
  return [a, b, c].filter(Boolean).join('\n\n')
})

function handleAnswerInput(field, nextValue) {
  if (!props.canEdit) return
  // Allow typing beyond the combined limit; we block "mark complete" (and clearly flag over-limit)
  // but still allow saving drafts over the limit.
  answers[field] = safeText(nextValue)
}

function copyCombined() {
  try {
    if (!combinedStatement.value) return
    navigator.clipboard.writeText(combinedStatement.value)
    showToast('Copied to clipboard')
  } catch (_) {
    showToast('Copy failed (browser blocked)')
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString()
  } catch (_) {
    return ''
  }
}

// Local autosave (fast UX) + server save (source of truth)
const localKey = computed(() => `vespa:ucas_application:v1:${(props.studentEmail || '').toLowerCase()}:${props.academicYear || 'current'}`)

function loadLocalDraft() {
  try {
    const raw = localStorage.getItem(localKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.answers) {
      answers.q1 = safeText(parsed.answers.q1)
      answers.q2 = safeText(parsed.answers.q2)
      answers.q3 = safeText(parsed.answers.q3)
    }
    if (parsed?.requirementsByCourse && typeof parsed.requirementsByCourse === 'object') {
      for (const [k, v] of Object.entries(parsed.requirementsByCourse)) {
        requirementsByCourse[k] = (v && typeof v === 'object') ? v : {}
      }
    }
    if (parsed?.selectedCourseKey) selectedCourseKey.value = safeText(parsed.selectedCourseKey)
  } catch (_) {}
}

function writeLocalDraft() {
  try {
    localStorage.setItem(localKey.value, JSON.stringify({
      updatedAt: new Date().toISOString(),
      selectedCourseKey: selectedCourseKey.value,
      answers: { ...answers },
      requirementsByCourse: { ...requirementsByCourse }
    }))
  } catch (_) {}
}

let autosaveTimer = null
watch(
  () => [answers.q1, answers.q2, answers.q3, selectedCourseKey.value, JSON.stringify(requirementsByCourse), localKey.value],
  () => {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => writeLocalDraft(), 450)
  }
)

const saving = ref(false)
const statementCompletedAt = ref('')
const statementMarking = ref(false)

async function loadFromServer() {
  if (!props.apiUrl || !props.studentEmail) return
  const resp = await fetchUcasApplication(props.studentEmail, props.apiUrl, props.academicYear || null)
  if (!resp?.success) return
  const data = resp.data || {}
  if (data.answers) {
    answers.q1 = safeText(data.answers.q1)
    answers.q2 = safeText(data.answers.q2)
    answers.q3 = safeText(data.answers.q3)
  }
  if (data.requirementsByCourse && typeof data.requirementsByCourse === 'object') {
    for (const [k, v] of Object.entries(data.requirementsByCourse)) {
      requirementsByCourse[k] = (v && typeof v === 'object') ? v : {}
    }
  }
  staffComments.value = Array.isArray(data.staffComments) ? data.staffComments : []
  if (data.selectedCourseKey) selectedCourseKey.value = safeText(data.selectedCourseKey)
  statementCompletedAt.value = safeText(data.statementCompletedAt || '')
}

async function markStatementComplete() {
  if (!props.canEdit || !props.apiUrl || !props.studentEmail) return
  if (statementCompletedAt.value) return
  if (totalChars.value > MAX_TOTAL_CHARS) {
    showToast(`Over the ${MAX_TOTAL_CHARS} character limit — please shorten before marking complete`)
    return
  }
  if (totalChars.value < MIN_TOTAL_CHARS) {
    showToast(`Need at least ${MIN_TOTAL_CHARS} characters before marking complete`)
    return
  }
  statementMarking.value = true
  try {
    const resp = await markUcasStatementComplete(
      props.studentEmail,
      props.apiUrl,
      props.academicYear || null,
      { roleHint: 'student' }
    )
    if (!resp?.success) throw new Error(resp?.error || 'Failed to mark statement complete')
    statementCompletedAt.value = safeText(resp?.data?.statementCompletedAt || new Date().toISOString())
    showToast('Statement marked complete (staff notified)')
  } catch (e) {
    showToast(e?.message || 'Failed to mark statement complete')
  } finally {
    statementMarking.value = false
  }
}

async function saveToServer() {
  if (!props.canEdit) {
    showToast('Read-only for staff — students can save')
    return
  }
  if (!props.apiUrl || !props.studentEmail) return
  saving.value = true
  try {
    const payload = {
      selectedCourseKey: selectedCourseKey.value || null,
      answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
      requirementsByCourse: { ...requirementsByCourse }
    }
    const resp = await saveUcasApplication(
      props.studentEmail,
      payload,
      props.apiUrl,
      props.academicYear || null,
      { roleHint: props.canEdit ? 'student' : 'staff' }
    )
    if (!resp?.success) throw new Error(resp?.error || 'Save failed')
    showToast('Saved')
  } catch (e) {
    showToast(e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function openFeedback(regenerate = false) {
  if (!props.canEdit) {
    showToast('Available for students')
    return
  }
  feedbackOpen.value = true
  if (!regenerate && feedbackText.value) return
  await generateFeedback()
}

async function generateFeedback() {
  if (!props.apiUrl || !props.studentEmail) return
  feedbackLoading.value = true
  feedbackError.value = ''
  feedbackText.value = ''
  try {
    const payload = {
      answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
      course: selectedCourse.value ? { ...selectedCourse.value } : null,
      totals: { totalChars: totalChars.value, remainingChars: remainingChars.value }
    }
    const resp = await generateUcasFeedback(
      props.studentEmail,
      payload,
      props.apiUrl,
      props.academicYear || null,
      { roleHint: 'student' }
    )
    if (!resp?.success) throw new Error(resp?.error || 'Failed to generate feedback')
    const text = safeText(resp?.data?.feedback || resp?.data || '')
    feedbackText.value = text.trim()
    if (!feedbackText.value) feedbackError.value = 'No feedback returned.'
  } catch (e) {
    feedbackError.value = e?.message || 'Failed to generate feedback'
  } finally {
    feedbackLoading.value = false
  }
}

async function addFeedbackAsComment() {
  if (!feedbackText.value || !props.apiUrl || !props.studentEmail) return
  feedbackAdding.value = true
  try {
    const resp = await addVirtualTutorComment(
      props.studentEmail,
      { comment: feedbackText.value },
      props.apiUrl,
      props.academicYear || null,
      { roleHint: 'student' }
    )
    if (!resp?.success) throw new Error(resp?.error || 'Failed to add comment')
    staffComments.value = Array.isArray(resp.data?.staffComments) ? resp.data.staffComments : staffComments.value
    showToast('Added to Tutor comments')
    feedbackOpen.value = false
  } catch (e) {
    showToast(e?.message || 'Failed to add comment')
  } finally {
    feedbackAdding.value = false
  }
}

// ---------------------------------------------------------------------------
// UCAS Tariff calculator (lightweight, based on `UCAS_Tariff_Calc.html`)
// ---------------------------------------------------------------------------
const UCAS_TARIFF = {
  'A-Level': { grades: { 'A*': 56, 'A': 48, 'B': 40, 'C': 32, 'D': 24, 'E': 16 } },
  'AS-Level': { grades: { 'A': 20, 'B': 16, 'C': 12, 'D': 10, 'E': 6 } },
  'BTEC Extended Certificate (1 A-Level)': { grades: { 'D*': 56, 'D': 48, 'M': 32, 'P': 16 } },
  'EPQ (Extended Project)': { grades: { 'A*': 28, 'A': 24, 'B': 20, 'C': 16, 'D': 12, 'E': 8 } }
}

function normalizeGrade(raw) {
  const s = safeText(raw).trim()
  if (!s) return ''
  const up = s.toUpperCase()

  // Common BTEC word forms → letters
  if (up === 'DISTINCTION*' || up === 'DISTINCTION *') return 'D*'
  if (up === 'DISTINCTION') return 'D'
  if (up === 'MERIT') return 'M'
  if (up === 'PASS') return 'P'

  // Keep A* as-is (uppercased already) and single-letter grades
  return up.replace(/\s+/g, '')
}

function inferQualType(subject) {
  const t = safeText(subject?.examType).toLowerCase()
  if (t.includes('epq') || t.includes('extended project')) return 'EPQ (Extended Project)'
  if (t.includes('as') && t.includes('level')) return 'AS-Level'
  if (t.includes('a level') || t.includes('a-level')) return 'A-Level'
  if (t.includes('btec')) return 'BTEC Extended Certificate (1 A-Level)'
  return 'A-Level'
}

function pointsFor(subject, gradeRaw) {
  const grade = normalizeGrade(gradeRaw)
  if (!grade) return { points: 0, unknown: 0 }

  const qualType = inferQualType(subject)
  const table = UCAS_TARIFF[qualType]?.grades || {}
  const pts = table[grade]
  if (typeof pts === 'number') return { points: pts, unknown: 0 }
  return { points: 0, unknown: 1 }
}

function gradesSummary(list) {
  const grades = (Array.isArray(list) ? list : [])
    .map((g) => normalizeGrade(g))
    .filter(Boolean)
  if (!grades.length) return ''
  return grades.join(' · ')
}

const ucasTariffGrades = computed(() => {
  const list = Array.isArray(props.subjects) ? props.subjects.slice(0, 5) : []

  const current = gradesSummary(list.map(s => s?.currentGrade))
  const target = gradesSummary(list.map(s => s?.targetGrade))

  // Required: prefer per-subject offer inputs; fall back to course offer if set
  const requiredList = []
  for (let i = 0; i < list.length; i++) {
    const rowKey = subjectRows.value[i]?.key
    const requiredGrade = rowKey ? (currentCourseSubjectOffers.value[rowKey] || '') : ''
    requiredList.push(requiredGrade)
  }
  let required = gradesSummary(requiredList)
  if (!required) {
    const courseOffer = safeText(selectedCourse.value?.offer).trim()
    required = courseOffer || ''
  }

  return { current, target, required }
})

const ucasTariff = computed(() => {
  const list = Array.isArray(props.subjects) ? props.subjects.slice(0, 5) : []
  let current = 0
  let target = 0
  let required = 0
  let unknownCount = 0

  // We align by index (same slice logic as subjectRows)
  for (let i = 0; i < list.length; i++) {
    const subj = list[i]
    const rowKey = subjectRows.value[i]?.key
    const requiredGrade = rowKey ? (currentCourseSubjectOffers.value[rowKey] || '') : ''

    const a = pointsFor(subj, subj?.currentGrade)
    const b = pointsFor(subj, subj?.targetGrade)
    const c = pointsFor(subj, requiredGrade)

    current += a.points
    target += b.points
    required += c.points
    unknownCount += a.unknown + b.unknown + c.unknown
  }

  return { current, target, required, unknownCount }
})

function ucasTariffBoxClass(value, required) {
  const v = Number(value) || 0
  const r = Number(required) || 0
  if (!r) return '' // no baseline
  if (!v) return '' // empty / unknown
  if (v >= r) return 'ucas-tariff-box--good'
  if (v >= Math.ceil(r * 0.9)) return 'ucas-tariff-box--warn'
  return 'ucas-tariff-box--bad'
}

function ucasTariffTooltip(title, explanation, value, required) {
  const v = Number(value) || 0
  const r = Number(required) || 0
  const parts = [`${title} UCAS points`, explanation, `Total: ${v}`]
  if (title !== 'Required' && r) {
    parts.push(`Required: ${r}`)
    const diff = v - r
    parts.push(diff >= 0 ? `Above by: ${diff}` : `Below by: ${Math.abs(diff)}`)
  }
  return parts.join('\n')
}

async function submitComment() {
  if (!props.canAddComment) return
  const text = newComment.value.trim()
  if (!text) return
  commentSaving.value = true
  try {
    const resp = await addUcasApplicationComment(
      props.studentEmail,
      { comment: text, staffEmail: props.staffEmail || null, __roleHint: props.canAddComment ? 'staff' : 'student' },
      props.apiUrl,
      props.academicYear || null
    )
    if (!resp?.success) throw new Error(resp?.error || 'Comment failed')
    staffComments.value = Array.isArray(resp.data?.staffComments) ? resp.data.staffComments : staffComments.value
    newComment.value = ''
    showToast('Comment posted')
  } catch (e) {
    showToast(e?.message || 'Comment failed')
  } finally {
    commentSaving.value = false
  }
}

onMounted(async () => {
  // default selection: server → local → topOffer → first offer
  const top = props.topOffer || (props.offers && props.offers.length ? props.offers[0] : null)
  if (top) selectedCourseKey.value = courseKeyForOffer(top)
  loadLocalDraft()
  await loadFromServer()
  if (props.canEdit) await loadReferenceStatus()
  if (!selectedCourseKey.value && top) selectedCourseKey.value = courseKeyForOffer(top)
})
</script>

<style scoped>
/* Clean UI styles based on `updatedUCASModal.html` */
.ucas-overlay{
  --ucas-primary:#2563eb;--ucas-primary-hover:#1d4ed8;--ucas-primary-light:#eff6ff;
  --ucas-success:#059669;--ucas-success-light:#ecfdf5;
  --ucas-warning:#d97706;--ucas-warning-light:#fffbeb;
  --ucas-danger:#dc2626;--ucas-danger-light:#fef2f2;
  --ucas-gray-50:#f9fafb;--ucas-gray-100:#f3f4f6;--ucas-gray-200:#e5e7eb;--ucas-gray-300:#d1d5db;--ucas-gray-400:#9ca3af;
  --ucas-gray-500:#6b7280;--ucas-gray-600:#4b5563;--ucas-gray-700:#374151;--ucas-gray-800:#1f2937;--ucas-gray-900:#111827;
  --ucas-white:#fff;
  --ucas-shadow-sm:0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ucas-shadow-lg:0 10px 15px -3px rgb(0 0 0 / 0.1),0 4px 6px -4px rgb(0 0 0 / 0.1);
  --ucas-radius:8px;--ucas-radius-lg:12px;--ucas-radius-xl:16px;
  position:fixed;inset:0;z-index:99999;
  background:rgba(0,0,0,.5);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;padding:12px;
}
.ucas-modal{width:100%;max-width:1600px;height:100%;max-height:calc(100vh - 24px);background:var(--ucas-white);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-lg);display:flex;flex-direction:column;overflow:hidden;position:relative}
.ucas-overlay--fullscreen{padding:0}
.ucas-modal--fullscreen{max-width:none;max-height:none;border-radius:0}

/* Embedded mode: allow UCAS UI to sit inside another modal/panel */
.ucas-overlay--embedded{
  position:relative;
  inset:auto;
  width:100%;
  height:100%;
  z-index:auto;
  background:transparent;
  backdrop-filter:none;
  padding:0;
}
.ucas-overlay--embedded .ucas-modal{
  max-width:none;
  max-height:none;
  width:100%;
  height:100%;
  border-radius:0;
  box-shadow:none;
  /* Make text/UI more readable when embedded in a split panel */
  transform:scale(1.08);
  transform-origin:top left;
  width:calc(100% / 1.08);
  height:calc(100% / 1.08);
}
.ucas-overlay--embedded .ucas-body{
  padding:16px;
}

.ucas-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 24px;background:var(--ucas-white);border-bottom:1px solid var(--ucas-gray-200);flex-wrap:wrap}
.ucas-header-left{display:flex;flex-direction:column;gap:8px}
.ucas-title{font-size:20px;font-weight:700;color:var(--ucas-gray-900);letter-spacing:-0.025em}
.ucas-course-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ucas-course-label{font-size:13px;font-weight:500;color:var(--ucas-gray-500)}
.ucas-select{appearance:none;background:var(--ucas-white);border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);padding:8px 36px 8px 12px;font-size:14px;color:var(--ucas-gray-900);min-width:320px;max-width:100%;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;transition:border-color .15s,box-shadow .15s}
.ucas-select:hover{border-color:var(--ucas-gray-400)}
.ucas-select:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-header-right{display:flex;align-items:center;gap:8px}

.ucas-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;font-size:13px;font-weight:600;border-radius:var(--ucas-radius);cursor:pointer;transition:all .15s;text-decoration:none;border:none;white-space:nowrap}
.ucas-btn:disabled{opacity:.5;cursor:not-allowed}
.ucas-btn-primary{background:var(--ucas-primary);color:var(--ucas-white)}
.ucas-btn-primary:hover:not(:disabled){background:var(--ucas-primary-hover)}
.ucas-btn-outline{background:var(--ucas-white);color:var(--ucas-gray-700);border:1px solid var(--ucas-gray-300)}
.ucas-btn-outline:hover:not(:disabled){background:var(--ucas-gray-50);border-color:var(--ucas-gray-400)}
.ucas-btn-feedback{
  background:linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.02));
  color:var(--ucas-primary);
  border:1px solid rgba(37, 99, 235, 0.35);
  box-shadow:0 1px 0 rgba(37, 99, 235, 0.08);
}
.ucas-btn-feedback:hover:not(:disabled){
  background:linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0.04));
  border-color:rgba(37, 99, 235, 0.55);
}
.ucas-btn-ghost{background:transparent;color:var(--ucas-gray-600)}
.ucas-btn-ghost:hover:not(:disabled){background:var(--ucas-gray-100);color:var(--ucas-gray-800)}
.ucas-btn-close{display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;background:transparent;border:none;border-radius:var(--ucas-radius);color:var(--ucas-gray-500);cursor:pointer;transition:all .15s}
.ucas-btn-close:hover{background:var(--ucas-gray-100);color:var(--ucas-gray-700)}
.ucas-btn-close--corner{position:absolute;top:12px;right:12px;background:var(--ucas-white);border:1px solid var(--ucas-gray-200);box-shadow:var(--ucas-shadow-sm);width:40px;height:40px;z-index:2}
.ucas-btn-close--corner:hover{background:var(--ucas-gray-50);color:var(--ucas-gray-900)}
.ucas-btn-close--corner-secondary{right:58px}

.ucas-body{flex:1;overflow-y:auto;padding:24px;background:var(--ucas-gray-50)}
.ucas-top-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
@media (max-width:1100px){.ucas-top-grid{grid-template-columns:1fr}}
.ucas-card{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-lg);padding:20px;box-shadow:var(--ucas-shadow-sm)}
.ucas-card-header{margin-bottom:16px}
.ucas-card-title{font-size:15px;font-weight:700;color:var(--ucas-gray-900);margin:0 0 4px 0}
.ucas-card-hint{font-size:13px;color:var(--ucas-gray-500);margin:0}
.ucas-empty{display:flex;align-items:center;gap:8px;padding:16px;background:var(--ucas-gray-50);border-radius:var(--ucas-radius);color:var(--ucas-gray-500);font-size:14px}
.ucas-empty--small{padding:12px}

.ucas-subjects-grid{display:grid;grid-template-columns:1fr 140px;gap:10px 16px;align-items:center}
.ucas-subjects-head{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ucas-gray-500);padding-bottom:4px}
.ucas-subject-name{font-size:14px;font-weight:600;color:var(--ucas-gray-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ucas-input{width:100%;padding:8px 12px;font-size:14px;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);background:var(--ucas-white);color:var(--ucas-gray-900);transition:border-color .15s,box-shadow .15s}
.ucas-input:hover:not(:disabled){border-color:var(--ucas-gray-400)}
.ucas-input:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-input::placeholder{color:var(--ucas-gray-400)}
.ucas-input:disabled{background:var(--ucas-gray-100);cursor:not-allowed}

.ucas-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.ucas-metric{background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:14px}
.ucas-metric--success{background:var(--ucas-success-light);border-color:#a7f3d0}
.ucas-metric--success .ucas-metric-status{color:var(--ucas-success)}
.ucas-metric--danger{background:var(--ucas-danger-light);border-color:#fecaca}
.ucas-metric--danger .ucas-metric-value{color:var(--ucas-danger)}
.ucas-metric-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ucas-gray-500);margin-bottom:4px}
.ucas-metric-value{font-size:22px;font-weight:700;color:var(--ucas-gray-900);line-height:1.2}
.ucas-metric-max{font-size:14px;font-weight:500;color:var(--ucas-gray-400)}
.ucas-metric-sub{font-size:12px;color:var(--ucas-gray-500);margin-top:4px}
.ucas-metric-sub--danger{color:var(--ucas-danger);font-weight:600}
.ucas-metric-status{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:var(--ucas-gray-500);margin-top:6px}
.ucas-progress-bar{height:6px;background:var(--ucas-gray-200);border-radius:3px;margin-top:8px;overflow:hidden}
.ucas-progress-fill{height:100%;background:var(--ucas-primary);border-radius:3px;transition:width .3s ease,background-color .3s ease}
.ucas-progress--warning{background:var(--ucas-warning)}
.ucas-progress--danger{background:var(--ucas-danger)}

.ucas-preview-header{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
.ucas-preview-title{font-size:13px;font-weight:600;color:var(--ucas-gray-700);margin:0}
.ucas-preview-hint{font-size:12px;color:var(--ucas-gray-400)}
.ucas-preview-box{white-space:pre-wrap;word-break:break-word;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px;font-size:13px;line-height:1.5;color:var(--ucas-gray-700);max-height:160px;overflow-y:auto}
.ucas-preview-box{white-space:pre-wrap;word-break:break-word;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px;font-size:14px;line-height:1.6;color:var(--ucas-gray-700);max-height:200px;overflow-y:auto}
.ucas-preview-box--expanded{max-height:none;min-height:70vh;font-size:16px;line-height:1.75}

.ucas-questions{display:flex;flex-direction:column;gap:16px}
.ucas-q{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-lg);padding:20px;box-shadow:var(--ucas-shadow-sm)}
.ucas-q-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}
.ucas-q-label{display:flex;align-items:flex-start;gap:10px;cursor:pointer}
.ucas-q-number{display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:var(--ucas-primary);color:var(--ucas-white);font-size:12px;font-weight:700;border-radius:50%;flex-shrink:0}
.ucas-q-title{font-size:14px;font-weight:600;color:var(--ucas-gray-800);line-height:1.4}
.ucas-q-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
.ucas-q-expand{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ucas-gray-300);background:var(--ucas-white);color:var(--ucas-gray-700);font-weight:700;font-size:12px;border-radius:999px;padding:4px 10px;cursor:pointer}
.ucas-q-expand:hover:not(:disabled){background:var(--ucas-gray-50);border-color:var(--ucas-gray-400)}
.ucas-q-expand:disabled{opacity:.5;cursor:not-allowed}
.ucas-q-count{font-size:12px;font-weight:500;color:var(--ucas-gray-400);white-space:nowrap;padding:2px 8px;background:var(--ucas-gray-100);border-radius:999px}
.ucas-q-count--active{background:var(--ucas-primary-light);color:var(--ucas-primary)}
.ucas-textarea{width:100%;min-height:160px;padding:14px 16px;font-size:16px;line-height:1.7;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);background:var(--ucas-white);color:var(--ucas-gray-900);resize:vertical;transition:border-color .15s,box-shadow .15s;font-family:inherit}
.ucas-textarea:hover:not(:disabled){border-color:var(--ucas-gray-400)}
.ucas-textarea:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-textarea::placeholder{color:var(--ucas-gray-400)}
.ucas-textarea:disabled{background:var(--ucas-gray-100);cursor:not-allowed}
.ucas-textarea-sm{min-height:80px}
.ucas-textarea-expanded{min-height:68vh;resize:none;font-size:18px;line-height:1.75}

.ucas-comments{margin-top:20px}
.ucas-comments-shell{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-sm);overflow:hidden}

.ucas-comments-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid var(--ucas-gray-200);background:var(--ucas-gray-50)}
.ucas-comments-header-left{display:flex;align-items:center;gap:12px}
.ucas-comments-icon{width:40px;height:40px;border-radius:var(--ucas-radius);display:flex;align-items:center;justify-content:center;background:var(--ucas-primary-light);color:var(--ucas-primary);flex-shrink:0}
.ucas-comments-title-group{min-width:0}
.ucas-comments-title{font-size:15px;font-weight:900;color:var(--ucas-gray-900);margin:0 0 2px 0}
.ucas-comments-subtitle{font-size:13px;color:var(--ucas-gray-500);margin:0}
.ucas-comments-count{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:999px;font-size:13px;font-weight:800;color:var(--ucas-gray-600);white-space:nowrap}
.ucas-comments-count-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--ucas-primary);color:var(--ucas-white);font-size:11px;font-weight:900}

.ucas-comments-compose{padding:18px 20px;border-bottom:1px solid var(--ucas-gray-200);background:var(--ucas-white)}
.ucas-comments-compose-row{display:flex;gap:12px}
.ucas-comments-compose-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px}
.ucas-comments-textarea{width:100%;min-height:110px;padding:12px 14px;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius-lg);font-size:14px;line-height:1.6;font-family:inherit;color:var(--ucas-gray-900);resize:vertical;transition:border-color .15s,box-shadow .15s;background:var(--ucas-white)}
.ucas-comments-textarea:hover:not(:disabled){border-color:var(--ucas-gray-400)}
.ucas-comments-textarea:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-comments-textarea:disabled{background:var(--ucas-gray-100);cursor:not-allowed}
.ucas-comments-compose-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.ucas-comments-compose-hint{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ucas-gray-400);font-weight:700}
.ucas-comments-compose-actions{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}

.ucas-comments-quick{margin-top:12px;padding-top:12px;border-top:1px solid var(--ucas-gray-200);background:var(--ucas-gray-50);border-radius:var(--ucas-radius);padding:12px}
.ucas-comments-quick-label{font-size:11px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.ucas-comments-quick-chips{display:flex;flex-wrap:wrap;gap:6px}
.ucas-comments-chip{padding:6px 10px;background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:999px;font-size:12px;font-weight:700;color:var(--ucas-gray-700);cursor:pointer;transition:all .15s}
.ucas-comments-chip:hover:not(:disabled){border-color:var(--ucas-primary);color:var(--ucas-primary);background:var(--ucas-primary-light)}
.ucas-comments-chip:disabled{opacity:.6;cursor:not-allowed}

.ucas-comments-list{max-height:420px;overflow:auto;background:var(--ucas-white)}
.ucas-comments-item{padding:16px 20px;border-bottom:1px solid var(--ucas-gray-100)}
.ucas-comments-item:last-child{border-bottom:none}
.ucas-comments-item:hover{background:var(--ucas-gray-50)}
.ucas-comments-item-main{display:flex;gap:12px}
.ucas-comments-item-content{flex:1;min-width:0}
.ucas-comments-item-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
.ucas-comments-item-author{display:flex;align-items:center;gap:8px;min-width:0}
.ucas-comments-author{font-size:14px;font-weight:800;color:var(--ucas-gray-900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ucas-comments-role{padding:2px 8px;background:var(--ucas-primary-light);color:var(--ucas-primary);font-size:11px;font-weight:900;border-radius:999px;white-space:nowrap}
.ucas-comments-date{font-size:12px;color:var(--ucas-gray-400);font-weight:700;white-space:nowrap}
.ucas-comments-body{font-size:14px;line-height:1.6;color:var(--ucas-gray-700);white-space:pre-wrap;word-break:break-word}
.ucas-comments-body--collapsed{display:-webkit-box;line-clamp:3;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ucas-comments-more{margin-top:6px;background:transparent;border:none;color:var(--ucas-primary);font-weight:900;font-size:12px;cursor:pointer;padding:0}
.ucas-comments-more:hover{text-decoration:underline}

.ucas-comments-divider{display:flex;align-items:center;gap:10px;padding:10px 20px;background:var(--ucas-gray-50)}
.ucas-comments-divider-line{flex:1;height:1px;background:var(--ucas-gray-200)}
.ucas-comments-divider-text{font-size:11px;font-weight:900;color:var(--ucas-gray-400);text-transform:uppercase;letter-spacing:.06em}

.ucas-comments-avatar{width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--ucas-white);flex-shrink:0}
.ucas-comments-avatar--compose{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)}
.ucas-comments-avatar--green{background:linear-gradient(135deg,#10b981 0%,#059669 100%)}
.ucas-comments-avatar--blue{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)}
.ucas-comments-avatar--purple{background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)}
.ucas-comments-avatar--orange{background:linear-gradient(135deg,#f97316 0%,#ea580c 100%)}

.ucas-comments-empty{padding:40px 20px;text-align:center;background:var(--ucas-white)}
.ucas-comments-empty-icon{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;background:var(--ucas-gray-100);display:flex;align-items:center;justify-content:center;color:var(--ucas-gray-400)}
.ucas-comments-empty-title{font-size:15px;font-weight:900;color:var(--ucas-gray-700);margin-bottom:4px}
.ucas-comments-empty-text{font-size:13px;color:var(--ucas-gray-500);font-weight:600}

@media (max-width:700px){
  .ucas-comments-header{padding:14px 14px}
  .ucas-comments-compose{padding:14px 14px}
  .ucas-comments-item{padding:14px 14px}
  .ucas-comments-divider{padding:10px 14px}
  .ucas-comments-list{max-height:380px}
}

.ucas-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 24px;background:var(--ucas-white);border-top:1px solid var(--ucas-gray-200)}
.ucas-footer-stats{display:flex;align-items:baseline;gap:4px;font-size:14px}
.ucas-footer-total{font-weight:700;color:var(--ucas-gray-900)}
.ucas-footer-divider{color:var(--ucas-gray-400)}
.ucas-footer-max{color:var(--ucas-gray-500)}
.ucas-footer-remaining{color:var(--ucas-gray-400);margin-left:4px}
.ucas-footer-warning{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--ucas-warning);margin-top:4px}
.ucas-footer-error{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--ucas-danger);margin-top:4px}

.ucas-toast{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--ucas-success-light);color:var(--ucas-success);font-size:13px;font-weight:500;border-radius:999px;border:1px solid #a7f3d0}
.toast-fade-enter-active,.toast-fade-leave-active{transition:opacity .2s ease}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0}

.ucas-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.ucas-body::-webkit-scrollbar,.ucas-preview-box::-webkit-scrollbar,.ucas-textarea::-webkit-scrollbar{width:8px}
.ucas-body::-webkit-scrollbar-track,.ucas-preview-box::-webkit-scrollbar-track,.ucas-textarea::-webkit-scrollbar-track{background:var(--ucas-gray-100);border-radius:4px}
.ucas-body::-webkit-scrollbar-thumb,.ucas-preview-box::-webkit-scrollbar-thumb,.ucas-textarea::-webkit-scrollbar-thumb{background:var(--ucas-gray-300);border-radius:4px}
.ucas-body::-webkit-scrollbar-thumb:hover,.ucas-preview-box::-webkit-scrollbar-thumb:hover,.ucas-textarea::-webkit-scrollbar-thumb:hover{background:var(--ucas-gray-400)}

/* UCAS points calculator panel */
.ucas-tariff{margin-top:16px;padding-top:12px;border-top:1px solid var(--ucas-gray-200)}
.ucas-tariff-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media (max-width:700px){.ucas-tariff-grid{grid-template-columns:1fr}}
.ucas-tariff-box{background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px}
.ucas-tariff-box--required{background:var(--ucas-warning-light);border-color:#fcd34d}
.ucas-tariff-box--good{background:var(--ucas-success-light);border-color:#a7f3d0}
.ucas-tariff-box--good .ucas-tariff-value{color:var(--ucas-success)}
.ucas-tariff-box--warn{background:var(--ucas-warning-light);border-color:#fcd34d}
.ucas-tariff-box--warn .ucas-tariff-value{color:var(--ucas-warning)}
.ucas-tariff-box--bad{background:var(--ucas-danger-light);border-color:#fecaca}
.ucas-tariff-box--bad .ucas-tariff-value{color:var(--ucas-danger)}
.ucas-tariff-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ucas-gray-500);margin-bottom:4px}
.ucas-tariff-value{font-size:20px;font-weight:800;color:var(--ucas-gray-900);line-height:1.1}
.ucas-tariff-sub{margin-top:6px;font-size:12px;font-weight:800;color:var(--ucas-gray-600)}
.ucas-tariff-sub-val{font-weight:900;color:var(--ucas-gray-800)}
.ucas-tariff-note{margin-top:8px;font-size:12px;color:var(--ucas-gray-500)}

/* Course meta pills (required grade + UCAS points) */
.ucas-course-meta{display:flex;gap:8px;flex-wrap:wrap}
.ucas-meta-pill{display:inline-flex;align-items:baseline;gap:6px;padding:6px 10px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:999px}
.ucas-meta-label{font-size:11px;font-weight:700;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.05em}
.ucas-meta-value{font-size:12px;font-weight:800;color:var(--ucas-gray-900)}

/* Feedback popup */
.ucas-feedback-overlay{position:absolute;inset:0;background:rgba(17,24,39,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.ucas-feedback-modal{width:min(820px, 100%);max-height:min(70vh, 680px);background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-lg);display:flex;flex-direction:column;overflow:hidden}
.ucas-feedback-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--ucas-gray-200);background:var(--ucas-white)}
.ucas-feedback-title{font-size:15px;font-weight:800;color:var(--ucas-gray-900)}
.ucas-feedback-body{padding:14px 16px;overflow:auto;background:var(--ucas-gray-50)}
.ucas-feedback-loading{display:flex;align-items:center;gap:10px;color:var(--ucas-gray-700);font-weight:600}
.ucas-feedback-error{background:var(--ucas-danger-light);border:1px solid #fecaca;border-radius:var(--ucas-radius);padding:12px;color:var(--ucas-danger);font-weight:600;white-space:pre-wrap}
.ucas-feedback-text{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px;color:var(--ucas-gray-800);white-space:pre-wrap;line-height:1.55}
.ucas-feedback-footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid var(--ucas-gray-200);background:var(--ucas-white)}

/* Teacher reference bar (header) */
.ucas-refbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ucas-refbar-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;border:1px solid var(--ucas-gray-300);background:var(--ucas-white);color:var(--ucas-gray-800);font-size:13px;font-weight:900;cursor:pointer}
.ucas-refbar-btn:hover:not(:disabled){background:var(--ucas-gray-50);border-color:var(--ucas-gray-400)}
.ucas-refbar-btn:disabled{opacity:.55;cursor:not-allowed}
.ucas-refbar-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;border:1px solid var(--ucas-gray-200);background:var(--ucas-gray-50);font-size:12px;font-weight:900;color:var(--ucas-gray-700)}
.ucas-refbar--in_progress{background:var(--ucas-warning-light);border-color:#fcd34d;color:var(--ucas-warning)}
.ucas-refbar--completed{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ucas-refbar--finalised{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ucas-refbar-count{opacity:.9}

/* Teacher reference progress card */
.ref-progress{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.ref-status{display:flex;align-items:center;gap:10px}
.ref-status-label{font-size:11px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em}
.ref-status-pill{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid var(--ucas-gray-200);background:var(--ucas-gray-50);font-weight:900;font-size:12px;color:var(--ucas-gray-700)}
.ref-status--not_started{background:var(--ucas-gray-50)}
.ref-status--in_progress{background:var(--ucas-warning-light);border-color:#fcd34d;color:var(--ucas-warning)}
.ref-status--completed{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ref-status--finalised{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ref-actions{display:flex;gap:8px;flex-wrap:wrap}

.ref-invites{margin-top:8px}
.ref-invites-header{display:flex;align-items:baseline;justify-content:space-between;margin:6px 0 10px}
.ref-invites-title{font-size:13px;font-weight:900;color:var(--ucas-gray-800)}
.ref-invites-meta{font-size:12px;color:var(--ucas-gray-500);font-weight:700}
.ref-invite-list{display:flex;flex-direction:column;gap:8px}
.ref-invite{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius)}
.ref-invite-email{font-weight:900;color:var(--ucas-gray-800);font-size:13px}
.ref-invite-sub{font-size:12px;color:var(--ucas-gray-500);font-weight:700;margin-top:2px}
.ref-invite-status{font-size:12px;font-weight:900;padding:6px 10px;border-radius:999px;border:1px solid var(--ucas-gray-200);white-space:nowrap}
.ref-ok{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ref-wait{background:var(--ucas-warning-light);border-color:#fcd34d;color:var(--ucas-warning)}

.ref-compose{margin-top:12px;padding-top:12px;border-top:1px solid var(--ucas-gray-200)}
.ref-compose-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:10px}
@media (max-width:900px){.ref-compose-grid{grid-template-columns:1fr}}
.ref-label{font-size:11px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.ref-compose-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.ref-invite-link{margin-top:12px}
.ref-link-row{display:flex;gap:8px;align-items:center}
.ref-link-row .ucas-input{flex:1}
.ref-select{min-width:unset}

/* Staff reference view */
.ref-staff-view{display:flex;flex-direction:column;gap:12px}
.ref-section{padding:12px;background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius)}
.ref-section-title{font-size:12px;font-weight:900;color:var(--ucas-gray-800);margin-bottom:6px}
.ref-section-body{white-space:pre-wrap;font-size:13px;color:var(--ucas-gray-700);line-height:1.4}
.ref-contrib-list{display:flex;flex-direction:column;gap:10px}
.ref-contrib{padding:10px 12px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius)}
.ref-contrib-meta{font-size:12px;color:var(--ucas-gray-600);font-weight:800;margin-bottom:6px}
.ref-contrib-text{white-space:pre-wrap;font-size:13px;color:var(--ucas-gray-800);line-height:1.45}

.ref-section--editor{background:var(--ucas-gray-50)}
.ref-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:900px){.ref-editor-grid{grid-template-columns:1fr}}
.ref-editor-block{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px}
.ref-textarea{min-height:160px;resize:vertical}
.ref-editor-actions{display:flex;justify-content:flex-end;margin-top:10px}

/* Redesigned Teacher reference panel (student + staff) */
.ucas-ref-modal{width:min(1100px, 100%);max-height:min(86vh, 920px)}
.ucas-ref-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 18px;color:var(--ucas-white);background:linear-gradient(135deg,var(--ucas-primary) 0%, #2b2360 100%);border-bottom:1px solid rgba(255,255,255,.14)}
.ucas-ref-header-left{display:flex;align-items:center;gap:14px}
.ucas-ref-icon{width:44px;height:44px;border-radius:var(--ucas-radius);display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.18);color:var(--ucas-white)}
.ucas-ref-title-group{min-width:0}
.ucas-ref-title{font-size:16px;font-weight:900;line-height:1.2}
.ucas-ref-subtitle{font-size:13px;opacity:.9}
.ucas-ref-close{width:36px;height:36px;border-radius:var(--ucas-radius);border:none;background:rgba(255,255,255,.12);color:var(--ucas-white);cursor:pointer;display:flex;align-items:center;justify-content:center}
.ucas-ref-close:hover{background:rgba(255,255,255,.2)}

.ucas-ref-statusbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:var(--ucas-gray-50);border-bottom:1px solid var(--ucas-gray-200);flex-wrap:wrap}
.ucas-ref-statusbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ucas-ref-status-label{font-size:12px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em}
.ucas-ref-status-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:900;background:var(--ucas-gray-100);color:var(--ucas-gray-700);border:1px solid var(--ucas-gray-200)}
.ucas-ref-status--not_started{background:var(--ucas-gray-100);color:var(--ucas-gray-700)}
.ucas-ref-status--in_progress{background:var(--ucas-warning-light);border-color:#fcd34d;color:var(--ucas-warning)}
.ucas-ref-status--completed,.ucas-ref-status--finalised{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ucas-ref-status-count{font-size:13px;color:var(--ucas-gray-500);font-weight:700}
.ucas-ref-refresh{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--ucas-white);border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);font-size:13px;font-weight:800;color:var(--ucas-gray-700);cursor:pointer}
.ucas-ref-refresh:hover:not(:disabled){background:var(--ucas-gray-50);border-color:var(--ucas-gray-400)}
.ucas-ref-refresh:disabled{opacity:.6;cursor:not-allowed}

.ucas-ref-body{padding:18px;background:var(--ucas-gray-50);overflow:auto;max-height:calc(min(86vh, 920px) - 170px)}
.ucas-ref-footer{padding:14px 18px;background:var(--ucas-white);border-top:1px solid var(--ucas-gray-200);display:flex;justify-content:flex-end}

.ucas-ref-steps{display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative;margin-bottom:18px}
.ucas-ref-steps:before{content:"";position:absolute;left:36px;right:36px;top:20px;height:2px;background:var(--ucas-gray-200)}
.ucas-ref-step{display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;z-index:1}
.ucas-ref-step-circle{width:40px;height:40px;border-radius:999px;background:var(--ucas-white);border:2px solid var(--ucas-gray-300);display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--ucas-gray-400)}
.ucas-ref-step-circle.active{background:var(--ucas-primary-light);border-color:var(--ucas-primary);color:var(--ucas-primary)}
.ucas-ref-step-circle.complete{background:var(--ucas-success);border-color:var(--ucas-success);color:var(--ucas-white)}
.ucas-ref-step-label{font-size:12px;font-weight:700;color:var(--ucas-gray-500);text-align:center;max-width:110px}
.ucas-ref-step-label.active{color:var(--ucas-primary);font-weight:900}

.ucas-ref-section{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-sm);padding:16px;margin-bottom:14px}
.ucas-ref-section--form{background:var(--ucas-white)}
.ucas-ref-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.ucas-ref-section-title{font-size:14px;font-weight:900;color:var(--ucas-gray-900)}
.ucas-ref-section-subtitle{font-size:13px;color:var(--ucas-gray-500);font-weight:600;margin-top:2px}
.ucas-ref-section-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:999px;font-size:12px;font-weight:900;color:var(--ucas-gray-700);white-space:nowrap}
.ucas-ref-section-body{white-space:pre-wrap;line-height:1.55;color:var(--ucas-gray-800);font-size:13px}

.ucas-ref-empty{display:flex;gap:12px;align-items:flex-start;padding:14px;border:1px dashed var(--ucas-gray-200);border-radius:var(--ucas-radius);background:var(--ucas-gray-50)}
.ucas-ref-empty-icon{width:40px;height:40px;border-radius:999px;background:var(--ucas-gray-100);display:flex;align-items:center;justify-content:center;color:var(--ucas-gray-400);flex-shrink:0}
.ucas-ref-empty-title{font-size:13px;font-weight:900;color:var(--ucas-gray-700)}
.ucas-ref-empty-text{font-size:12px;color:var(--ucas-gray-500);font-weight:600;margin-top:2px}

.ucas-ref-invite-list{display:flex;flex-direction:column;gap:10px}
.ucas-ref-invite{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);transition:border-color .15s}
.ucas-ref-invite.submitted{background:var(--ucas-success-light);border-color:#a7f3d0}
.ucas-ref-invite-left{display:flex;align-items:center;gap:12px;min-width:0}
.ucas-ref-invite-avatar{width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--ucas-white);flex-shrink:0}
.ucas-ref-invite-meta{min-width:0}
.ucas-ref-invite-name{font-size:13px;font-weight:900;color:var(--ucas-gray-900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ucas-ref-invite-sub{font-size:12px;color:var(--ucas-gray-500);font-weight:700;margin-top:2px}
.ucas-ref-invite-status{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;white-space:nowrap}
.ucas-ref-invite-status.ok{background:var(--ucas-success-light);color:var(--ucas-success);border:1px solid #a7f3d0}
.ucas-ref-invite-status.wait{background:var(--ucas-warning-light);color:var(--ucas-warning);border:1px solid #fcd34d}

.ucas-ref-invite-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ucas-ref-invite-action{background:transparent;border:1px solid var(--ucas-gray-300);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;color:var(--ucas-gray-700);cursor:pointer}
.ucas-ref-invite-action:hover:not(:disabled){background:var(--ucas-gray-50);border-color:var(--ucas-gray-400)}
.ucas-ref-invite-action:disabled{opacity:.6;cursor:not-allowed}
.ucas-ref-invite-action--danger{border-color:#fecaca;color:var(--ucas-danger);background:var(--ucas-danger-light)}
.ucas-ref-invite-action--danger:hover{background:#fee2e2}
.ucas-ref-hidden-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}

.ucas-ref-contrib--accordion{padding:0}
.ucas-ref-accordion-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:none;background:var(--ucas-gray-50);cursor:pointer;border-radius:var(--ucas-radius-xl)}
.ucas-ref-accordion-head:hover{background:var(--ucas-gray-100)}
.ucas-ref-accordion-right{display:flex;align-items:center;gap:8px}
.ucas-ref-accordion-chevron{font-weight:900;color:var(--ucas-gray-500)}
.ucas-ref-accordion-body{padding:0 16px 16px}

.ucas-ref-form-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:900;color:var(--ucas-gray-800);margin-bottom:12px}
.ucas-ref-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:700px){.ucas-ref-form-grid{grid-template-columns:1fr}}
.ucas-ref-label{font-size:11px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.ucas-ref-input,.ucas-ref-select{width:100%;padding:10px 12px;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);background:var(--ucas-white);color:var(--ucas-gray-900);font-size:14px;transition:border-color .15s,box-shadow .15s}
.ucas-ref-input:hover,.ucas-ref-select:hover{border-color:var(--ucas-gray-400)}
.ucas-ref-input:focus,.ucas-ref-select:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-ref-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px;flex-wrap:wrap}

.ucas-ref-linkcopy{margin-top:12px;padding:12px;background:var(--ucas-primary-light);border:1px solid rgba(62,50,133,.25);border-radius:var(--ucas-radius)}
.ucas-ref-linkcopy-label{font-size:12px;font-weight:900;color:var(--ucas-primary);margin-bottom:8px}
.ucas-ref-linkcopy-row{display:flex;gap:8px;align-items:center}
.ucas-ref-linkcopy-input{flex:1;padding:8px 10px;border:1px solid rgba(62,50,133,.25);border-radius:var(--ucas-radius);background:var(--ucas-white);font-size:13px;color:var(--ucas-gray-700)}
.ucas-ref-linkcopy-btn{padding:8px 12px;border:none;border-radius:var(--ucas-radius);background:var(--ucas-primary);color:var(--ucas-white);font-weight:900;font-size:13px;cursor:pointer}
.ucas-ref-linkcopy-btn:hover{background:#2b2360}
.ucas-ref-linkcopy-hint{font-size:11px;color:var(--ucas-primary);opacity:.85;margin-top:8px;font-weight:700}

.ucas-ref-staff-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}
.ucas-ref-staff-title{font-size:14px;font-weight:900;color:var(--ucas-gray-900)}
.ucas-ref-staff-meta{font-size:12px;color:var(--ucas-gray-500);font-weight:700}

.ucas-ref-contrib{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-sm);padding:16px;margin-bottom:14px}
.ucas-ref-contrib-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.ucas-ref-contrib-title{display:flex;align-items:center;gap:8px;font-weight:900;color:var(--ucas-gray-900);font-size:14px}
.ucas-ref-num{width:22px;height:22px;border-radius:999px;background:var(--ucas-primary);color:var(--ucas-white);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0}
.ucas-ref-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--ucas-gray-100);color:var(--ucas-gray-700);font-weight:900;font-size:12px;border:1px solid var(--ucas-gray-200);white-space:nowrap}
.ucas-ref-badge.has-content{background:var(--ucas-success-light);border-color:#a7f3d0;color:var(--ucas-success)}
.ucas-ref-contrib-sub{font-size:13px;color:var(--ucas-gray-500);font-weight:600;margin-bottom:10px}
.ucas-ref-editor{background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-lg);padding:14px}
.ucas-ref-editor-select{margin-bottom:10px}
.ucas-ref-textarea{width:100%;min-height:140px;padding:12px;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);background:var(--ucas-white);font-size:14px;line-height:1.6;font-family:inherit;color:var(--ucas-gray-900);resize:vertical;transition:border-color .15s,box-shadow .15s}
.ucas-ref-textarea:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-ref-editor-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap}
.ucas-ref-char{font-size:12px;color:var(--ucas-gray-400);font-weight:700}

.ucas-ref-existing{margin-top:14px}
.ucas-ref-existing-title{font-size:12px;font-weight:900;color:var(--ucas-gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.ucas-ref-existing-list{display:flex;flex-direction:column;gap:10px}
.ucas-ref-existing-item{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px}
.ucas-ref-existing-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.ucas-ref-existing-author{display:flex;align-items:center;gap:8px;min-width:0}
.ucas-ref-existing-avatar{width:24px;height:24px;border-radius:999px;background:var(--ucas-primary-light);color:var(--ucas-primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0}
.ucas-ref-existing-name{font-size:13px;font-weight:900;color:var(--ucas-gray-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ucas-ref-existing-subject{font-size:12px;color:var(--ucas-gray-500);font-weight:700;white-space:nowrap}
.ucas-ref-existing-text{font-size:14px;color:var(--ucas-gray-700);line-height:1.55}

.ucas-ref-contrib-list{display:flex;flex-direction:column;gap:10px}
.ucas-ref-contrib-item{background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px}
.ucas-ref-contrib-meta{font-size:12px;color:var(--ucas-gray-600);font-weight:900;margin-bottom:6px}
.ucas-ref-contrib-text{white-space:pre-wrap;font-size:13px;color:var(--ucas-gray-800);line-height:1.5}

/* Expanded writing overlay */
.ucas-expand-overlay{position:fixed;inset:0;z-index:100000;background:rgba(17,24,39,.42);display:flex;align-items:center;justify-content:center;padding:0}
.ucas-expand-modal{width:100vw;height:100vh;max-width:none;max-height:none;background:var(--ucas-white);border:0;border-radius:0;box-shadow:var(--ucas-shadow-lg);display:flex;flex-direction:column;overflow:hidden}
.ucas-expand-header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--ucas-gray-200);background:var(--ucas-white)}
.ucas-expand-title{font-size:14px;font-weight:900;color:var(--ucas-gray-900)}
.ucas-expand-meta{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.ucas-expand-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:999px;font-size:12px;font-weight:800;color:var(--ucas-gray-700)}
.ucas-expand-body{flex:1;padding:12px 16px;background:var(--ucas-gray-50)}
.ucas-expand-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--ucas-gray-200);background:var(--ucas-white)}
.ucas-expand-hint{font-size:12px;color:var(--ucas-gray-500);font-weight:600}

@media (max-width:700px){
  .ucas-q-expand{padding:4px 8px}
  .ucas-expand-overlay{padding:0}
  .ucas-expand-modal{width:100%;height:100%;border-radius:0}
  .ucas-textarea-expanded{min-height:62vh}
}
</style>
