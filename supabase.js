(() => {
  'use strict';

  const SUPABASE_URL = 'https://plbwpklgwthlagpnzdqt.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Vr2geuC3-diuIsk5ZSmrQw_sFfWxqij';
  const API = `${SUPABASE_URL}/rest/v1`;
  const FEST_REGISTRATION_API = 'https://plbwpklgwthlagpnzdqt.supabase.co/rest/v1/registation/fest';
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  async function request(path, options = {}) {
    const response = await fetch(`${API}/${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }

  window.iqraSupabase = {
    enabled: true,
    async getStudents() {
      return request('portal_students?select=*&order=id.asc');
    },
    async deleteStudent(id) {
      return request(`portal_students?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal'
        }
      });
    },
    async saveStudents(students) {
      return request('portal_students?on_conflict=id', {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(students.map(student => ({
          id: student.id,
          name: student.name,
          score: student.score,
          attendance: student.attendance,
          photo: student.photo || '',
          password: student.password || '',
          email: student.email || '',
          portfolio_link: student.portfolioLink || '',
          first_login: student.firstLogin !== false,
          last_login: student.lastLogin || '',
          history: student.history || [],
          show_online_status: student.show_online_status !== false
        })))
      });
    },
    async getSuggestions() {
      return request('portal_suggestions?select=*&order=created_at.asc');
    },
    async deleteSuggestion(id) {
      return request(`portal_suggestions?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal'
        }
      });
    },
    async saveSuggestion(suggestion) {
      return request('portal_suggestions', {
        method: 'POST',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          name: suggestion.name || '',
          email: suggestion.email || '',
          category: suggestion.category,
          message: suggestion.message
        })
      });
    },
    async getChatMessages(userId = '') {
      const identity = String(userId || '').trim();
      const filter = identity
        ? `&or=(sender_id.eq.${encodeURIComponent(identity)},recipient_id.eq.${encodeURIComponent(identity)})`
        : '';
      return request(`portal_chat_messages?select=*&order=created_at.asc${filter}`);
    },
    async saveChatMessage(message) {
      return request('portal_chat_messages', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          student_id: Number(message.studentId),
          sender_id: String(message.from),
          recipient_id: String(message.to),
          message: message.text || '',
          attachment_name: message.fileName || '',
          attachment_type: message.fileType || (message.voiceUrl ? 'audio/webm' : (message.fileName && /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(message.fileName) ? 'audio/mpeg' : message.fileName && /\.(mp4|webm|mov|m4v|avi|ogg)$/i.test(message.fileName) ? 'video/mp4' : '')),
          attachment_url: message.fileUrl || '',
          seen_at: message.seen ? new Date().toISOString() : null
        })
      });
    },
    async updateChatSeen(id) {
      return request(`portal_chat_messages?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          seen_at: new Date().toISOString()
        })
      });
    },
    async deleteChatMessage(id) {
      const messageId = String(id || '').trim();
      if (!messageId) throw new Error('Message ID is required');
      return request(`portal_chat_messages?id=eq.${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal'
        }
      });
    },
    async getChatPresence() {
      return request('portal_chat_presence?select=*&order=last_seen.desc');
    },
    async saveChatPresence(presence) {
      return request('portal_chat_presence?on_conflict=user_id', {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          user_id: String(presence.userId),
          student_id: presence.studentId ? Number(presence.studentId) : null,
          display_name: presence.displayName || '',
          role: presence.role || 'student',
          is_online: presence.isOnline !== false,
          show_online_status: presence.showOnlineStatus !== false,
          last_seen: new Date().toISOString()
        })
      });
    },
    async getRegistrations() {
      return request('portal_fest_registrations?select=*&order=created_at.asc');
    },
    async saveRegistration(registration) {
      const response = await fetch(FEST_REGISTRATION_API, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          activity_id: registration.activity_id,
          student_id: registration.student_id,
          student_name: registration.student_name
        })
      });
      if (!response.ok) {
        throw new Error(`Fest registration request failed: ${response.status}`);
      }
      return response.status === 204 ? null : response.json().catch(() => null);
    },
    async getFestRegistrations() {
      const response = await fetch(`${FEST_REGISTRATION_API}?select=*&order=created_at.asc`, {
        method: 'GET',
        headers
      });
      if (!response.ok) {
        throw new Error(`Fest registration read failed: ${response.status}`);
      }
      return response.json();
    },
    async removeFestRegistration(activityId, studentId) {
      const response = await fetch(`${FEST_REGISTRATION_API}?activity_id=eq.${encodeURIComponent(activityId)}&student_id=eq.${encodeURIComponent(studentId)}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          Prefer: 'return=minimal'
        }
      });
      if (!response.ok) {
        throw new Error(`Fest registration removal failed: ${response.status}`);
      }
    },
    async removeRegistration(activityId, studentId) {
      return request(`portal_fest_registrations?activity_id=eq.${encodeURIComponent(activityId)}&student_id=eq.${studentId}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal'
        }
      });
    }
  };
})();
