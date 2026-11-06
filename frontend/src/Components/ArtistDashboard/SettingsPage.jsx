import { useUserStore } from "../../store/useUserStore";

const SettingsPage = () => {
  const { user } = useUserStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#EAE4D5]">Settings</h1>
        <p className="text-[#B6B09F] mt-1">
          Manage your portal preferences and details.
        </p>
      </div>

      <div className="max-w-2xl bg-[#0a0a0a] border border-[#B6B09F]/10 p-8 rounded-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-[#B6B09F] text-sm font-medium mb-1">
              Legal Name
            </label>
            <p className="text-[#EAE4D5] text-lg font-medium">
              {user?.legalName || "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-[#B6B09F] text-sm font-medium mb-1">
              Stage Name
            </label>
            <p className="text-[#EAE4D5] text-lg font-medium">
              {user?.stageName || "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-[#B6B09F] text-sm font-medium mb-1">
              Email Address
            </label>
            <p className="text-[#EAE4D5] text-lg font-medium">
              {user?.email || "Not set"}
            </p>
          </div>

          <hr className="border-[#B6B09F]/10 my-6" />

          <p className="text-[#B6B09F] text-sm">
            To change your legal name or account details, please reach out
            directly to your account representative.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
