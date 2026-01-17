<template>
  <div class="ucas-overlay" role="dialog" aria-modal="true" aria-label="UCAS Application" @click.self="emit('close')">
    <div class="ucas-modal">
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
            class="ucas-btn ucas-btn-primary"
            type="button"
            @click="saveToServer"
            :disabled="!canEdit || saving || totalChars > MAX_TOTAL_CHARS || totalChars < MIN_TOTAL_CHARS || !studentEmail"
            :title="!canEdit ? 'Read-only for staff — students can save' : 'Save UCAS application'"
          >
            <svg v-if="!saving" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span v-if="saving" class="ucas-spinner"></span>
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button class="ucas-btn-close" type="button" @click="emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                </div>
                <div
                  class="ucas-tariff-box"
                  :class="ucasTariffBoxClass(ucasTariff.target, ucasTariff.required)"
                  :title="ucasTariffTooltip('Target', 'Calculated from Target grades shown in your Academic Profile.', ucasTariff.target, ucasTariff.required)"
                >
                  <div class="ucas-tariff-label">Target</div>
                  <div class="ucas-tariff-value">{{ ucasTariff.target.toLocaleString() }}</div>
                </div>
                <div
                  class="ucas-tariff-box ucas-tariff-box--required"
                  :title="ucasTariffTooltip('Required', 'Calculated from the Offer grade inputs on this page (per subject).', ucasTariff.required, ucasTariff.required)"
                >
                  <div class="ucas-tariff-label">Required</div>
                  <div class="ucas-tariff-value">{{ ucasTariff.required.toLocaleString() }}</div>
                </div>
              </div>
              <div v-if="ucasTariff.unknownCount > 0" class="ucas-tariff-note">
                Some grades couldn’t be converted to points (format/qualification not recognised).
              </div>
            </div>
          </div>

          <!-- Teacher Reference Progress (students only; content hidden) -->
          <div class="ucas-card" v-if="canEdit">
            <div class="ucas-card-header">
              <h2 class="ucas-card-title">Teacher reference progress</h2>
              <p class="ucas-card-hint">Students can’t view the reference text, but you can track who’s been invited and who has submitted.</p>
            </div>

            <div class="ref-progress">
              <div class="ref-status">
                <span class="ref-status-label">Status</span>
                <span class="ref-status-pill" :class="`ref-status--${referenceStatus}`">{{ referenceStatusLabel }}</span>
              </div>

              <div class="ref-actions">
                <button class="ucas-btn ucas-btn-outline" type="button" @click="loadReferenceStatus" :disabled="refLoading">
                  {{ refLoading ? 'Refreshing…' : 'Refresh' }}
                </button>
                <button class="ucas-btn ucas-btn-primary" type="button" @click="markComplete" :disabled="refLoading || referenceStatus === 'completed' || referenceStatus === 'finalised'">
                  Mark complete
                </button>
              </div>
            </div>

            <div class="ref-invites">
              <div class="ref-invites-header">
                <div class="ref-invites-title">Invited teachers</div>
                <div class="ref-invites-meta">{{ (referenceInvites || []).length }} invited</div>
              </div>

              <div v-if="referenceInvites.length === 0" class="ucas-empty ucas-empty--small">
                <span>No invitations yet.</span>
              </div>
              <div v-else class="ref-invite-list">
                <div v-for="inv in referenceInvites" :key="inv.id" class="ref-invite">
                  <div class="ref-invite-main">
                    <div class="ref-invite-email">{{ inv.teacherEmail }}</div>
                    <div class="ref-invite-sub">
                      <span v-if="inv.teacherName">{{ inv.teacherName }}</span>
                      <span v-if="inv.subjectKey"> • {{ inv.subjectKey }}</span>
                    </div>
                  </div>
                  <div class="ref-invite-status" :class="inv.status === 'submitted' ? 'ref-ok' : 'ref-wait'">
                    {{ inv.status === 'submitted' ? 'Submitted' : 'Pending' }}
                  </div>
                </div>
              </div>

              <div class="ref-compose">
                <div class="ref-compose-grid">
                  <div>
                    <div class="ref-label">Teacher email</div>
                    <input class="ucas-input" type="email" v-model="inviteEmail" placeholder="teacher@school.org" />
                  </div>
                  <div>
                    <div class="ref-label">Subject (optional)</div>
                    <select class="ucas-select ref-select" v-model="inviteSubjectKey">
                      <option value="">No subject</option>
                      <option v-for="s in subjectRows" :key="s.key" :value="s.label">{{ s.label }}</option>
                    </select>
                  </div>
                </div>
                <div class="ref-compose-actions">
                  <button class="ucas-btn ucas-btn-outline" type="button" @click="inviteEmail=''; inviteSubjectKey=''" :disabled="refInviteSending">
                    Clear
                  </button>
                  <button class="ucas-btn ucas-btn-primary" type="button" @click="sendInvite" :disabled="refInviteSending || !inviteEmail.trim()">
                    {{ refInviteSending ? 'Sending…' : 'Send to teacher' }}
                  </button>
                </div>

                <div v-if="lastInviteUrl" class="ref-invite-link">
                  <div class="ref-label">Invite link (copy)</div>
                  <div class="ref-link-row">
                    <input class="ucas-input" type="text" :value="lastInviteUrl" readonly />
                    <button class="ucas-btn ucas-btn-outline" type="button" @click="copyText(lastInviteUrl)">Copy</button>
                  </div>
                  <div class="hint">Email delivery is best-effort; you can always copy the link and send it manually.</div>
                </div>
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
                <div class="ucas-metric-sub">{{ remainingChars.toLocaleString() }} remaining</div>
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
                <button class="ucas-q-expand" type="button" @click="openExpanded('q1')" :disabled="!canEdit" title="Expand for focused writing">
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
                <button class="ucas-q-expand" type="button" @click="openExpanded('q2')" :disabled="!canEdit" title="Expand for focused writing">
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
                <button class="ucas-q-expand" type="button" @click="openExpanded('q3')" :disabled="!canEdit" title="Expand for focused writing">
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
              @input="(e) => handleAnswerInput('q3', e.target.value)"
              placeholder="Super-curricular, work experience, reading, volunteering, clubs… what did it develop?"
            />
          </div>
        </section>

        <section v-if="commentsEnabled" class="ucas-comments">
          <div class="ucas-card">
            <div class="ucas-card-header">
              <h2 class="ucas-card-title">Tutor comments</h2>
              <p class="ucas-card-hint">Staff can add comments; students can read them.</p>
            </div>

            <div v-if="canAddComment" class="ucas-comment-compose">
              <textarea v-model="newComment" class="ucas-textarea ucas-textarea-sm" placeholder="Add a comment…" />
              <div class="ucas-comment-actions">
                <button class="ucas-btn ucas-btn-ghost" type="button" @click="newComment = ''" :disabled="commentSaving || !newComment">
                  Clear
                </button>
                <button class="ucas-btn ucas-btn-primary" type="button" @click="submitComment" :disabled="commentSaving || !newComment.trim()">
                  {{ commentSaving ? 'Posting…' : 'Post comment' }}
                </button>
              </div>
            </div>

            <div v-if="staffComments.length === 0" class="ucas-empty ucas-empty--small">
              <span>No comments yet.</span>
            </div>
            <div v-else class="ucas-comment-list">
              <div v-for="c in staffComments" :key="c.id" class="ucas-comment">
                <div class="ucas-comment-meta">
                  <span class="ucas-comment-author">{{ c.staffEmail || 'Staff' }}</span>
                  <span class="ucas-comment-date">{{ formatDate(c.createdAt) }}</span>
                </div>
                <div class="ucas-comment-body">
                  <template v-if="isCommentExpanded(c.id)">
                    {{ c.comment }}
                  </template>
                  <template v-else>
                    {{ commentPreview(c.comment) }}
                  </template>
                </div>
                <button
                  v-if="(c.comment || '').length > COMMENT_COLLAPSE_AT"
                  class="ucas-comment-more"
                  type="button"
                  @click="toggleCommentExpanded(c.id)"
                >
                  {{ isCommentExpanded(c.id) ? 'Show less' : 'Show more' }}
                </button>
              </div>
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
            <span class="ucas-footer-remaining">({{ remainingChars.toLocaleString() }} remaining)</span>
          </div>
          <div v-if="totalChars > 0 && totalChars < MIN_TOTAL_CHARS" class="ucas-footer-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Add {{ MIN_TOTAL_CHARS - totalChars }} more characters to reach the minimum.
          </div>
          <div v-if="totalChars >= MAX_TOTAL_CHARS" class="ucas-footer-error">
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
            <textarea
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
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { fetchUcasApplication, saveUcasApplication, addUcasApplicationComment, generateUcasFeedback, addVirtualTutorComment, fetchReferenceStatus, createReferenceInvite, markReferenceComplete } from '../services/api.js'

const MAX_TOTAL_CHARS = 4000
const MIN_TOTAL_CHARS = 350

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
  staffEmail: { type: String, default: '' }
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

// Teacher reference progress (student view: progress only)
const refLoading = ref(false)
const referenceStatus = ref('not_started')
const referenceInvites = ref([])
const inviteEmail = ref('')
const inviteSubjectKey = ref('')
const refInviteSending = ref(false)
const lastInviteUrl = ref('')

const referenceStatusLabel = computed(() => {
  const s = referenceStatus.value
  if (s === 'finalised') return 'Finalised'
  if (s === 'completed') return 'Completed'
  if (s === 'in_progress') return 'In progress'
  return 'Not started'
})

async function loadReferenceStatus() {
  if (!props.canEdit || !props.apiUrl || !props.studentEmail) return
  refLoading.value = true
  try {
    const resp = await fetchReferenceStatus(props.studentEmail, props.apiUrl, props.academicYear || null)
    if (!resp?.success) throw new Error(resp?.error || 'Failed to load reference status')
    referenceStatus.value = safeText(resp?.data?.status || 'not_started')
    referenceInvites.value = Array.isArray(resp?.data?.invites) ? resp.data.invites : []
  } catch (e) {
    showToast(e?.message || 'Failed to load reference status')
  } finally {
    refLoading.value = false
  }
}

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
    lastInviteUrl.value = safeText(resp?.data?.inviteUrl || '')
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

async function markComplete() {
  if (!props.canEdit || !props.apiUrl || !props.studentEmail) return
  refLoading.value = true
  try {
    const resp = await markReferenceComplete(props.studentEmail, props.apiUrl, props.academicYear || null)
    if (!resp?.success) throw new Error(resp?.error || 'Failed to mark complete')
    showToast('Marked complete')
    await loadReferenceStatus()
  } catch (e) {
    showToast(e?.message || 'Failed to mark complete')
  } finally {
    refLoading.value = false
  }
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
const expandedField = ref('q1') // 'q1'|'q2'|'q3'
const expandedTextareaEl = ref(null)

const expandedTitle = computed(() => {
  if (expandedField.value === 'q2') return 'Q2: How studies prepared you'
  if (expandedField.value === 'q3') return 'Q3: Outside education'
  return 'Q1: Why this course?'
})

const expandedValue = computed(() => answers[expandedField.value] || '')
const expandedChars = computed(() => (answers[expandedField.value] || '').length)

function openExpanded(field) {
  if (!props.canEdit) return
  expandedField.value = field
  expandedOpen.value = true
  // Focus textarea after render
  setTimeout(() => {
    try {
      expandedTextareaEl.value && expandedTextareaEl.value.focus && expandedTextareaEl.value.focus()
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

const combinedStatement = computed(() => {
  const a = safeText(answers.q1).trim()
  const b = safeText(answers.q2).trim()
  const c = safeText(answers.q3).trim()
  return [a, b, c].filter(Boolean).join('\n\n')
})

function handleAnswerInput(field, nextValue) {
  if (!props.canEdit) return
  const next = safeText(nextValue)
  const currentLen = answers[field].length
  const otherTotal = totalChars.value - currentLen
  const allowed = Math.max(0, MAX_TOTAL_CHARS - otherTotal)
  answers[field] = next.slice(0, allowed)
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
  await loadReferenceStatus()
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
  display:flex;align-items:center;justify-content:center;padding:16px;
}
.ucas-modal{width:100%;max-width:1400px;height:100%;max-height:calc(100vh - 32px);background:var(--ucas-white);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-lg);display:flex;flex-direction:column;overflow:hidden}

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
.ucas-metric-status{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:var(--ucas-gray-500);margin-top:6px}
.ucas-progress-bar{height:6px;background:var(--ucas-gray-200);border-radius:3px;margin-top:8px;overflow:hidden}
.ucas-progress-fill{height:100%;background:var(--ucas-primary);border-radius:3px;transition:width .3s ease,background-color .3s ease}
.ucas-progress--warning{background:var(--ucas-warning)}
.ucas-progress--danger{background:var(--ucas-danger)}

.ucas-preview-header{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
.ucas-preview-title{font-size:13px;font-weight:600;color:var(--ucas-gray-700);margin:0}
.ucas-preview-hint{font-size:12px;color:var(--ucas-gray-400)}
.ucas-preview-box{white-space:pre-wrap;word-break:break-word;background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px;font-size:13px;line-height:1.5;color:var(--ucas-gray-700);max-height:160px;overflow-y:auto}

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
.ucas-textarea{width:100%;min-height:140px;padding:12px 14px;font-size:14px;line-height:1.6;border:1px solid var(--ucas-gray-300);border-radius:var(--ucas-radius);background:var(--ucas-white);color:var(--ucas-gray-900);resize:vertical;transition:border-color .15s,box-shadow .15s;font-family:inherit}
.ucas-textarea:hover:not(:disabled){border-color:var(--ucas-gray-400)}
.ucas-textarea:focus{outline:none;border-color:var(--ucas-primary);box-shadow:0 0 0 3px var(--ucas-primary-light)}
.ucas-textarea::placeholder{color:var(--ucas-gray-400)}
.ucas-textarea:disabled{background:var(--ucas-gray-100);cursor:not-allowed}
.ucas-textarea-sm{min-height:80px}
.ucas-textarea-expanded{min-height:52vh;resize:none}

.ucas-comments{margin-top:20px}
.ucas-comment-compose{margin-top:12px}
.ucas-comment-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.ucas-comment-list{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.ucas-comment{background:var(--ucas-gray-50);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius);padding:12px 14px}
.ucas-comment-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
.ucas-comment-author{font-size:13px;font-weight:600;color:var(--ucas-gray-800)}
.ucas-comment-date{font-size:12px;color:var(--ucas-gray-400)}
.ucas-comment-body{font-size:14px;color:var(--ucas-gray-700);line-height:1.5}
.ucas-comment-more{margin-top:8px;background:transparent;border:none;color:var(--ucas-primary);font-weight:700;font-size:12px;cursor:pointer;padding:0;align-self:flex-start}
.ucas-comment-more:hover{text-decoration:underline}

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

/* Expanded writing overlay */
.ucas-expand-overlay{position:fixed;inset:0;z-index:100000;background:rgba(17,24,39,.42);display:flex;align-items:center;justify-content:center;padding:12px}
.ucas-expand-modal{width:min(980px, 100%);height:min(86vh, 820px);background:var(--ucas-white);border:1px solid var(--ucas-gray-200);border-radius:var(--ucas-radius-xl);box-shadow:var(--ucas-shadow-lg);display:flex;flex-direction:column;overflow:hidden}
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
