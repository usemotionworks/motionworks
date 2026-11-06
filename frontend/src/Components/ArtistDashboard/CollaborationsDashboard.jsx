import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaPlayCircle,
  FaCheck,
  FaTimes,
  FaInbox,
  FaPaperPlane,
  FaUserAstronaut,
  FaPlus,
} from "react-icons/fa";
import axios from "../../lib/axios";
import { useUserStore } from "../../store/useUserStore";
import { toast } from "react-hot-toast";
import ResponseCollabModal from "../ResponseCollabModal";
import ProposeCollabModal from "../ProposeCollabModal";
import SnippetPlayer from "../SnippetPlayer";
import AcceptCollabModal from "../AcceptCollabModal";

const CollaborationsDashboard = () => {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(
    user?.isAvailableForCollab || false,
  );
  const [selectedFile, setSelectedFile] = useState(null);
  // Modal State
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [proposalData, setProposalData] = useState({
    trackTitle: "",
    proposedSplit: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [pendingAction, setPendingAction] = useState({
    id: null,
    artistName: "",
    status: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // 1. Fetch initial data
  const fetchCollabs = useCallback(async () => {
    try {
      const res = await axios.get("/api/collaborations");
      setIncoming(res.data.incoming);
      setOutgoing(res.data.outgoing);
    } catch (err) {
      toast.error("Failed to load collaborations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollabs();
  }, [fetchCollabs]);

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      // Assuming you have a route to update user profile/settings
      await axios.patch("/api/users/profile/collab-toggle", {
        isAvailableForCollab: newStatus,
      });
      setIsAvailable(newStatus);
      toast.success(
        newStatus
          ? "You are now visible for collaborations"
          : "Collaboration discovery disabled",
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // 2. Debounced Search for Artists
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await axios.get(
            `/api/collaborations/search?q=${searchQuery}`,
          );
          setSearchResults(res.data);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 3. Handle Proposing
  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please upload a snippet");

    if (selectedFile.size > 10 * 1024 * 1024) {
      // 10MB limit
      return toast.error("File is too large. Please upload a shorter snippet.");
    }

    const formData = new FormData();
    formData.append("recipientId", selectedArtist._id);
    formData.append("trackTitle", proposalData.trackTitle);
    formData.append("proposedSplit", proposalData.proposedSplit);
    formData.append("audio", selectedFile);

    try {
      setIsSubmitting(true); // Start Spinner
      await axios.post("/api/collaborations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Proposal sent successfully!");
      setShowProposeModal(false);
      setSelectedFile(null); // Reset file
      fetchCollabs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false); // Stop Spinner
    }
  };

  // 4. Handle Respond (Accept/Decline)
  const handleResponse = (id, status) => {
    setPendingAction({ id, status });
    if (status === "accepted") {
      setShowAcceptModal(true);
    } else {
      setShowResponseModal(true); // Your decline modal
    }
  };

  const executeResponse = async (id, status, feedback) => {
    try {
      await axios.patch(`/api/collaborations/${id}/respond`, {
        status,
        feedback,
      });
      toast.success(`Collaboration ${status}`);

      // ADD THESE LINES:
      setShowAcceptModal(false);
      setShowResponseModal(false);

      fetchCollabs();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  // Dynamic Rank Logic
  const getRank = () => {
    const releases = user?.releaseCount || 0;
    if (releases >= 20) return { name: "Pro", limit: "10/week" };
    if (releases >= 10) return { name: "Rising", limit: "3/Week" };
    return { name: "Newcomer", limit: "1/Week" };
  };

  const openResponseModal = (collab, status) => {
    setPendingAction({
      id: collab._id,
      artistName: collab.requesterId?.stageName || "Artist",
      status: status,
    });

    if (status === "accepted") {
      setShowAcceptModal(true);
    } else {
      setShowResponseModal(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#B6B09F]/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#EAE4D5] tracking-tight">
            Collab Hub
          </h1>
          <p className="text-[#B6B09F]/60 text-sm mt-1">
            Connect, negotiate, and split royalties securely.
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* NEW: Availability Toggle */}
          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#B6B09F]/10 px-4 py-2 rounded-lg">
            <span className="text-[10px] uppercase tracking-widest text-[#B6B09F]/50 font-bold">
              Open for Collabs
            </span>
            <button
              onClick={toggleAvailability}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isAvailable ? "bg-green-500" : "bg-[#B6B09F]/20"}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${isAvailable ? "left-6" : "left-1"}`}
              />
            </button>
          </div>

          {/* Rank & Status Section */}
          <div className="flex items-center gap-4 bg-[#0a0a0a] border border-[#B6B09F]/10 px-4 py-2 rounded-lg">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-[#B6B09F]/50">
                Your Rank
              </p>
              <p className="text-sm font-bold text-[#EAE4D5]">
                {getRank().name}
              </p>
            </div>
            <div className="h-8 w-px bg-[#B6B09F]/10"></div>
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-widest text-[#B6B09F]/50">
                Invites
              </p>
              <p
                className={`text-sm font-bold ${isAvailable ? "text-green-500" : "text-[#B6B09F]/30"}`}
              >
                {getRank().limit}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-[#B6B09F]/10 pb-px">
        {[
          { id: "discover", icon: <FaSearch />, label: "Discover" },
          {
            id: "incoming",
            icon: <FaInbox />,
            label: "Incoming",
            badge: incoming.length,
          },
          { id: "outgoing", icon: <FaPaperPlane />, label: "Outgoing" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "text-[#EAE4D5] border-b-2 border-[#EAE4D5]"
                : "text-[#B6B09F]/40 hover:text-[#B6B09F]"
            }`}
          >
            {tab.icon} {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "discover" && (
          <div className="space-y-6">
            <div className="relative max-w-xl">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/30" />
              <input
                type="text"
                placeholder="Search artists by stage name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-[#EAE4D5] outline-none text-[#EAE4D5]"
              />
            </div>

            <div className="grid gap-4">
              {searchResults.map((artist) => (
                <div
                  key={artist._id}
                  className="bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#B6B09F]/10 rounded-full flex items-center justify-center text-[#B6B09F]">
                      <FaUserAstronaut />
                    </div>
                    <div>
                      <h3 className="text-[#EAE4D5] font-bold">
                        {artist.stageName}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedArtist(artist);
                      setShowProposeModal(true);
                    }}
                    className="bg-[#EAE4D5] text-black px-4 py-2 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-white"
                  >
                    Propose Feature
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "incoming" && (
          <div className="space-y-4">
            {incoming.map((req) => (
              <div
                key={req._id}
                className="bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div>
                  <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest mb-1">
                    Incoming Proposal from
                  </p>
                  <h3 className="text-lg font-bold text-[#EAE4D5]">
                    {req.requesterId?.stageName}
                  </h3>
                  <p className="text-sm text-[#B6B09F] mt-1">
                    Track: "{req.trackTitle}" • Split:{" "}
                    <span className="text-[#EAE4D5]">{req.proposedSplit}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {req.snippetUrl ? (
                    <SnippetPlayer url={req.snippetUrl} />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#B6B09F]/5 rounded-lg border border-dashed border-[#B6B09F]/20">
                      <div className="w-3 h-3 border-2 border-[#B6B09F]/20 border-t-[#B6B09F] rounded-full animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest text-[#B6B09F]/40">
                        Optimizing Audio...
                      </span>
                    </div>
                  )}
                  {req.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponse(req._id, "accepted")}
                        className="p-3 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => handleResponse(req._id, "declined")}
                        className="p-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B6B09F]/40">
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="space-y-4">
            {outgoing.map((req) => (
              <div
                key={req._id}
                className="bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl p-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest mb-1">
                    Sent to {req.recipientId?.stageName}
                  </p>
                  <h3 className="text-md font-bold text-[#EAE4D5]">
                    "{req.trackTitle}"
                  </h3>
                  <p className="text-xs text-[#B6B09F] mt-1">
                    Split Proposed: {req.proposedSplit}%
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${
                      req.status === "declined"
                        ? "bg-red-500/10 text-red-500"
                        : "..."
                    }`}
                  >
                    {req.status}
                  </span>
                  {req.status === "declined" && req.rejectionReason && (
                    <p className="text-[10px] text-red-400/60 mt-2 max-w-[200px] italic">
                      "{req.rejectionReason}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProposeCollabModal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        artist={selectedArtist}
        isSubmitting={isSubmitting}
        onSend={handleSendProposal}
      />

      <ResponseCollabModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onConfirm={(reason) =>
          executeResponse(pendingAction.id, "declined", reason)
        }
      />

      <AcceptCollabModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        artistName={pendingAction.artistName}
        onConfirm={(terms) =>
          executeResponse(pendingAction.id, "accepted", terms)
        }
      />
    </div>
  );
};

export default CollaborationsDashboard;
