"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { useTranslator } from "@/core/translator";
import { ADMIN_CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";

export type ContactInquiryCategory =
  | "HISTORY_INQUIRY"
  | "BUG_REPORT"
  | "ASSET_PERMISSION"
  | "PARTNERSHIP"
  | "GENERAL";

export type ContactInquiryStatus = "NEW" | "REVIEWED" | "RESOLVED";

export interface ContactInquiry {
  readonly id: string;
  readonly senderName: string;
  readonly senderEmail: string;
  readonly category: ContactInquiryCategory;
  readonly subject: string;
  readonly message: string;
  readonly status: ContactInquiryStatus;
  readonly createdAt: string;
  readonly replyNote: string | null;
}

export interface ContactChannels {
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly hours: string;
}

const DEFAULT_CHANNELS: ContactChannels = {
  email: APP_CONFIG.contactEmail,
  phone: APP_CONFIG.contactPhone,
  address: "Graha Budaya Nusantara, Jl. Majapahit No. 45, Jakarta Pusat 10160",
  hours: "Senin – Jumat, 09.00 – 17.00 WIB",
};

const INITIAL_INQUIRIES: readonly ContactInquiry[] = [
  {
    id: "inq-001",
    senderName: "Raden Arya Kusuma",
    senderEmail: "arya.kusuma@sejarah.id",
    category: "HISTORY_INQUIRY",
    subject: "Klarifikasi Atribut Senjata Gajah Mada",
    message:
      "Salam Kurator. Pada kartu Mahapatih Gajah Mada (MAJ-01), apakah visual keris yang disematkan merujuk pada Keris Kyai Condong Campur atau representasi tradisi lisan Jawa Timur? Mohon rujukan manuskripnya.",
    status: "NEW",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    replyNote: null,
  },
  {
    id: "inq-002",
    senderName: "Dr. Sri Sulastri, M.Hum",
    senderEmail: "sri.sulastri@ugm.ac.id",
    category: "PARTNERSHIP",
    subject: "Usulan Kolaborasi Digitalisasi Prasasti Canggal",
    message:
      "Kami dari Departemen Arkeologi ingin mengajukan kolaborasi penelitian transkripsi digital untuk prasasti era Mataram Kuno dan Majapahit agar dapat diintegrasikan sebagai referensi kartu taktis.",
    status: "REVIEWED",
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    replyNote: "Sudah dihubungi via email perihal jadwal pertemuan daring tim kurasi.",
  },
  {
    id: "inq-003",
    senderName: "Bima Wicaksono",
    senderEmail: "bima.gaming@warriors.net",
    category: "BUG_REPORT",
    subject: "Efek Kartu Kendang Sentris Tidak Menambah Buff DEF",
    message:
      "Saat bertanding di Putaran 3, kartu instrumen Kendang Sentris dimainkan di baris instrumen, namun modifier ATK lawan tidak tereduksi sesuai deskripsi. Mohon dicek engine perhitungannya.",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    replyNote: "Telah diverifikasi dan diperbaiki pada update patch v1.1.0.",
  },
  {
    id: "inq-004",
    senderName: "Yayasan Cagar Budaya Sunda",
    senderEmail: "info@cagarsunda.or.id",
    category: "ASSET_PERMISSION",
    subject: "Lisensi Foto Artefak Mahkota Binokasih",
    message:
      "Perihal pemanfaatan dokumentasi Mahkota Binokasih Sanghyang Pake untuk kartu Pusaka Pajajaran, kami menyediakan arsip foto beresolusi tinggi dengan lisensi CC BY-SA 4.0 resmi.",
    status: "NEW",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    replyNote: null,
  },
];

const STORAGE_KEY_CHANNELS = "nusantara_admin_contact_channels";
const STORAGE_KEY_INQUIRIES = "nusantara_admin_contact_inquiries";

export function useAdminContact() {
  const { t } = useTranslator();
  const [channels, setChannels] = useState<ContactChannels>(DEFAULT_CHANNELS);
  const [isEditingChannels, setIsEditingChannels] = useState(false);
  const [channelsForm, setChannelsForm] = useState<ContactChannels>(DEFAULT_CHANNELS);

  const [inquiries, setInquiries] = useState<readonly ContactInquiry[]>(INITIAL_INQUIRIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | ContactInquiryStatus>("ALL");

  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const [feedback, setFeedback] = useState<{
    readonly message: string;
    readonly variant: "success" | "error";
  } | null>(null);

  // Load persisted channels and inquiries from localStorage if available
  useEffect(() => {
    try {
      const savedChannels = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (savedChannels) {
        const parsed = JSON.parse(savedChannels) as ContactChannels;
        setChannels(parsed);
        setChannelsForm(parsed);
      }
      const savedInquiries = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      if (savedInquiries) {
        setInquiries(JSON.parse(savedInquiries) as readonly ContactInquiry[]);
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  const handleSaveChannels = (): void => {
    setChannels(channelsForm);
    setIsEditingChannels(false);
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channelsForm));
    } catch {
      // ignore
    }
    setFeedback({
      message: t(ADMIN_CONTACT_TEXT_CONSTANT.FEEDBACK_CHANNEL_SAVED),
      variant: "success",
    });
  };

  const handleCancelEditChannels = (): void => {
    setChannelsForm(channels);
    setIsEditingChannels(false);
  };

  const handleUpdateStatus = (
    id: string,
    nextStatus: ContactInquiryStatus,
    note?: string | null
  ): void => {
    const updated = inquiries.map((item) =>
      item.id === id
        ? {
            ...item,
            status: nextStatus,
            replyNote: note !== undefined ? note : item.replyNote,
          }
        : item
      );
    setInquiries(updated);
    try {
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setFeedback({
      message: t(ADMIN_CONTACT_TEXT_CONSTANT.FEEDBACK_STATUS_UPDATED),
      variant: "success",
    });
  };

  const handleOpenReplyModal = (inquiry: ContactInquiry): void => {
    setSelectedInquiry(inquiry);
    setReplyInput(inquiry.replyNote ?? "");
  };

  const handleCloseReplyModal = (): void => {
    setSelectedInquiry(null);
    setReplyInput("");
  };

  const handleSubmitReply = (): void => {
    if (!selectedInquiry) return;
    handleUpdateStatus(selectedInquiry.id, "RESOLVED", replyInput.trim() || null);
    handleCloseReplyModal();
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (activeTab !== "ALL" && item.status !== activeTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.senderName.toLowerCase().includes(q) ||
        item.senderEmail.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [inquiries, activeTab, searchQuery]);

  const newInquiriesCount = useMemo(() => {
    return inquiries.filter((item) => item.status === "NEW").length;
  }, [inquiries]);

  return {
    channels,
    isEditingChannels,
    setIsEditingChannels,
    channelsForm,
    setChannelsForm,
    handleSaveChannels,
    handleCancelEditChannels,
    inquiries,
    filteredInquiries,
    newInquiriesCount,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedInquiry,
    replyInput,
    setReplyInput,
    handleOpenReplyModal,
    handleCloseReplyModal,
    handleSubmitReply,
    handleUpdateStatus,
    feedback,
  };
}
