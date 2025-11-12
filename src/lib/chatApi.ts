import axios from "axios";
import { config } from "@/config/config";

export interface ChatMessageDTO {
  _id?: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt?: string;
  attachments?: AttachmentDTO[];
}

const BASE = config.API_BASE_URL;

export interface StaffInfo {
  _id: string;
  id?: string;
  username?: string;
  fullName?: string;
  email?: string;
  role: string;
}

export interface AttachmentDTO {
  url: string;
  type: string; // mime
  name?: string;
  size?: number;
}

export async function fetchAllStaff(token?: string | null): Promise<StaffInfo[]> {
  try {
    const res = await axios.get(`${BASE}/api/users/getallprofile`, {
      params: { role: "staff", limit: 50, page: 1 },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const staffArray = res.data?.data?.items || res.data?.data?.users || [];
    console.log("👥 Fetched all staff:", staffArray.length);
    return staffArray;
  } catch (err) {
    console.error("❌ Error fetching all staff:", err);
    return [];
  }
}

export async function fetchDefaultStaffId(token?: string | null): Promise<string | null> {
  try {
    console.log("🔍 Fetching staff list with token:", token ? "✓" : "✗");
    const res = await axios.get(`${BASE}/api/users/getallprofile`, {
      params: { role: "staff", limit: 10, page: 1 }, // Lấy 10 staff để có nhiều lựa chọn
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    
    console.log("📋 Full response:", res);
    console.log("📋 res.data:", res.data);
    
    const responseData = res.data;
    
    // Backend returns: { message, success, data: { items: [...], pagination: {...} } }
    // NOT users, but items!
    const usersArray = responseData.data?.items || responseData.data?.users;
    
    console.log("👥 Users array:", usersArray);
    console.log("👥 Type:", typeof usersArray);
    console.log("👥 Is array?", Array.isArray(usersArray));
    console.log("👥 Length:", usersArray?.length);
    
    if (!Array.isArray(usersArray) || usersArray.length === 0) {
      console.warn("⚠️ No staff found");
      return null;
    }
    
    const firstUser = usersArray[0];
    console.log("👤 First user:", firstUser);
    
    const staffId = firstUser._id || firstUser.id || null;
    console.log("✅ Staff ID extracted:", staffId);
    
    console.log("✅ Selected staff:", { 
      id: staffId, 
      username: firstUser.username, 
      role: firstUser.role,
      fullName: firstUser.fullName
    });
    
    console.log(`📊 Total ${usersArray.length} staff(s) available`);
    
    return staffId;
    
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    console.error("❌ Error fetching staff:", error.response?.data || error.message);
    console.error("❌ Full error:", err);
    return null;
  }
}

export async function getChatHistory(otherId: string, token: string) {
  const res = await axios.get(`${BASE}/api/chat/history/${otherId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as ChatMessageDTO[];
}

export interface ChatPartnerDTO { _id: string; fullName?: string; username?: string; email?: string; role?: string }

export async function getChatPartners(token: string): Promise<ChatPartnerDTO[]> {
  try {
    const res = await axios.get(`${BASE}/api/chat/partners`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.partners || [];
  } catch (e) {
    console.error('❌ Error getChatPartners', e);
    return [];
  }
}

export async function sendChatMessage(receiver: string, content: string, token: string) {
  const res = await axios.post(
    `${BASE}/api/chat/send`,
    { receiver, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data as ChatMessageDTO;
}

export async function uploadChatFile(file: File, token: string): Promise<AttachmentDTO> {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post(`${BASE}/api/chat/upload`, form, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as AttachmentDTO;
}

export async function sendChatWithAttachments(params: { receiver: string; content?: string; attachments?: AttachmentDTO[] }, token: string) {
  const res = await axios.post(
    `${BASE}/api/chat/send`,
    { receiver: params.receiver, content: params.content ?? '', attachments: params.attachments ?? [] },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data as ChatMessageDTO;
}
