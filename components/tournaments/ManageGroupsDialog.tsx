import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Dialog,
  Portal,
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  List,
  TextInput,
} from "react-native-paper";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import {
  Group,
  Participant,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";

interface ManageGroupsDialogProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  groups: Group[];
  participants: Participant[];
  onUpdate: (groups: Group[]) => void;
  drawGenerated?: boolean;
  hasPlayedMatches?: boolean;
}

export function ManageGroupsDialog({
  visible,
  onClose,
  tournamentId,
  groups: initialGroups,
  participants,
  onUpdate,
  drawGenerated = false,
  hasPlayedMatches = false,
}: ManageGroupsDialogProps) {
  const [localGroups, setLocalGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedGroupNames, setEditedGroupNames] = useState<Record<string, string>>({});
  const [groupNameErrors, setGroupNameErrors] = useState<Record<string, string>>({});
  const [numberOfGroups] = useState(26); // Maximum number of groups allowed
  const [activeTab, setActiveTab] = useState<'groups' | 'unassigned'>('groups');
  const [participantSearchQuery, setParticipantSearchQuery] = useState<Record<string, string>>({});
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      if (initialGroups && initialGroups.length > 0) {
        setLocalGroups(
          initialGroups.map((group) => ({
            ...group,
            participants: [...group.participants],
          }))
        );
        // Initialize edited names with current group names
        const initialNames: Record<string, string> = {};
        initialGroups.forEach((group) => {
          initialNames[group.groupId] = group.groupName;
        });
        setEditedGroupNames(initialNames);
      } else {
        setLocalGroups([]);
        setEditedGroupNames({});
      }
      // Reset editing state when dialog opens
      setEditingGroupId(null);
      setGroupNameErrors({});
    }
  }, [visible, initialGroups]);

  const getAssignedParticipantIds = () => {
    const assigned = new Set<string>();
    localGroups.forEach((group) => {
      group.participants.forEach((p) => {
        assigned.add(p._id);
      });
    });
    return assigned;
  };

  const getUnassignedParticipants = () => {
    const assigned = getAssignedParticipantIds();
    return participants.filter((p) => !assigned.has(p._id));
  };

  const addParticipantToGroup = (groupId: string, participant: Participant) => {
    setLocalGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          if (group.participants.some((p) => p._id === participant._id)) {
            return group;
          }
          return {
            ...group,
            participants: [...group.participants, participant],
          };
        }
        return group;
      })
    );
  };

  const removeParticipantFromGroup = (groupId: string, participantId: string) => {
    setLocalGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          return {
            ...group,
            participants: group.participants.filter((p) => p._id !== participantId),
          };
        }
        return group;
      })
    );
  };

  const createNewGroup = () => {
    // Check if we've reached the configured number of groups
    if (numberOfGroups && localGroups.length >= numberOfGroups) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Maximum number of groups reached (${numberOfGroups}).`,
      });
      return;
    }

    const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existingGroupIds = new Set(localGroups.map((g) => g.groupId));
    let newGroupId = "";
    let newGroupName = "";

    for (let i = 0; i < groupLabels.length; i++) {
      const label = groupLabels[i];
      if (!existingGroupIds.has(label)) {
        newGroupId = label;
        newGroupName = `Group ${label}`;
        break;
      }
    }

    if (!newGroupId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Maximum number of groups reached (26)",
      });
      return;
    }

    setLocalGroups((prev) => [
      ...prev,
      {
        groupId: newGroupId,
        groupName: newGroupName,
        participants: [],
        rounds: [],
        standings: [],
      },
    ]);
    
    // Initialize edited name for the new group
    setEditedGroupNames((prev) => ({
      ...prev,
      [newGroupId]: newGroupName,
    }));
  };

  // Validate group name
  const validateGroupName = (groupId: string, name: string): string | null => {
    const trimmedName = name.trim();
    
    // Check empty
    if (!trimmedName) {
      return "Group name cannot be empty";
    }
    
    // Check length
    if (trimmedName.length > 50) {
      return "Group name must be 50 characters or less";
    }
    
    // Check uniqueness
    const duplicate = localGroups.find(
      (g) => g.groupId !== groupId && g.groupName === trimmedName
    );
    if (duplicate) {
      return "Group name must be unique";
    }
    
    return null; // Valid
  };

  // Start editing a group name
  const startEditingGroupName = (groupId: string) => {
    setEditingGroupId(groupId);
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group) {
      setEditedGroupNames((prev) => ({
        ...prev,
        [groupId]: group.groupName,
      }));
      setGroupNameErrors((prev) => ({
        ...prev,
        [groupId]: "",
      }));
    }
  };

  // Cancel editing a group name
  const cancelEditingGroupName = (groupId: string) => {
    setEditingGroupId(null);
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group) {
      setEditedGroupNames((prev) => ({
        ...prev,
        [groupId]: group.groupName,
      }));
    }
    setGroupNameErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[groupId];
      return newErrors;
    });
  };

  // Save edited group name
  const saveGroupName = (groupId: string) => {
    const editedName = editedGroupNames[groupId] || "";
    const error = validateGroupName(groupId, editedName);
    
    if (error) {
      setGroupNameErrors((prev) => ({
        ...prev,
        [groupId]: error,
      }));
      return;
    }
    
    // Update the group name in localGroups
    const trimmedName = editedName.trim();
    setLocalGroups((prev) =>
      prev.map((group) =>
        group.groupId === groupId
          ? { ...group, groupName: trimmedName }
          : group
      )
    );
    
    setEditingGroupId(null);
    setGroupNameErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[groupId];
      return newErrors;
    });
  };

  // Handle group name input change
  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Filter participants by search query
  const filterParticipants = (participants: Participant[], query: string) => {
    if (!query.trim()) return participants;
    const lowerQuery = query.toLowerCase();
    return participants.filter(p => 
      getParticipantDisplayName(p).toLowerCase().includes(lowerQuery)
    );
  };

  // Get filtered unassigned participants
  const getFilteredUnassignedParticipants = () => {
    const unassigned = getUnassignedParticipants();
    return filterParticipants(unassigned, unassignedSearchQuery);
  };

  // Get filtered participants for a specific group search
  const getFilteredParticipantsForGroup = (groupId: string) => {
    const unassigned = getUnassignedParticipants();
    const query = participantSearchQuery[groupId] || '';
    return filterParticipants(unassigned, query);
  };

  // Handle group name input change
  const handleGroupNameChange = (groupId: string, value: string) => {
    setEditedGroupNames((prev) => ({
      ...prev,
      [groupId]: value,
    }));
    
    // Clear error when user starts typing
    if (groupNameErrors[groupId]) {
      setGroupNameErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[groupId];
        return newErrors;
      });
    }
  };

  // Handle participant search for a group
  const handleParticipantSearch = (groupId: string, query: string) => {
    setParticipantSearchQuery(prev => ({
      ...prev,
      [groupId]: query,
    }));
  };

  const deleteGroup = (groupId: string) => {
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group && group.participants.length > 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot delete group with participants. Remove all participants first.",
      });
      return;
    }

    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setLocalGroups((prev) => prev.filter((g) => g.groupId !== groupId));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validate all group names before saving
    const validationErrors: Record<string, string> = {};
    for (const group of localGroups) {
      const error = validateGroupName(group.groupId, group.groupName);
      if (error) {
        validationErrors[group.groupId] = error;
      }
    }

    // If there are validation errors, show them and don't save
    if (Object.keys(validationErrors).length > 0) {
      setGroupNameErrors(validationErrors);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fix group name errors before saving",
      });
      return;
    }

    setSaving(true);
    try {
      const groupsData = localGroups.map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName.trim(), // Ensure trimmed
        participants: group.participants.map((p) => p._id),
      }));

      const { data } = await axiosInstance.put(`/tournaments/${tournamentId}/groups`, {
        groups: groupsData,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Groups updated successfully",
      });

      onUpdate(data.tournament.groups);
      onClose();
    } catch (err: any) {
      console.error("Error updating groups:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to update groups",
      });
    } finally {
      setSaving(false);
    }
  };

  const unassignedParticipants = getUnassignedParticipants();
  const filteredUnassignedParticipants = getFilteredUnassignedParticipants();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Manage Groups</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={styles.description}>
            Organize participants into groups
          </Text>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
              onPress={() => setActiveTab('groups')}
            >
              <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
                Groups ({localGroups.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'unassigned' && styles.activeTab]}
              onPress={() => setActiveTab('unassigned')}
            >
              <Text style={[styles.tabText, activeTab === 'unassigned' && styles.activeTabText]}>
                Unassigned ({unassignedParticipants.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'groups' ? (
            <View style={styles.groupsContainer}>
              {/* Create New Group Button */}
              <Button
                mode="outlined"
                onPress={createNewGroup}
                style={styles.createGroupButton}
                disabled={localGroups.length >= numberOfGroups}
                icon="plus-circle-outline"
              >
                Create New Group
              </Button>

              {/* Groups List */}
              <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
                {localGroups.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#9ca3af" />
                    <Text variant="bodyMedium" style={styles.emptyStateText}>
                      No groups yet
                    </Text>
                    <Text variant="bodySmall" style={styles.emptyStateSubText}>
                      Create your first group to start organizing participants
                    </Text>
                  </View>
                ) : (
                  localGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.groupId);
                    const filteredParticipants = getFilteredParticipantsForGroup(group.groupId);
                    
                    return (
                      <View key={group.groupId} style={styles.groupCard}>
                        <View style={styles.groupHeader}>
                          <View style={styles.groupTitleSection}>
                            {editingGroupId === group.groupId ? (
                              <View style={styles.editGroupSection}>
                                <TextInput
                                  mode="outlined"
                                  value={editedGroupNames.hasOwnProperty(group.groupId) ? editedGroupNames[group.groupId] : group.groupName}
                                  onChangeText={(value) => handleGroupNameChange(group.groupId, value)}
                                  onBlur={() => saveGroupName(group.groupId)}
                                  style={styles.groupNameInput}
                                  dense
                                  maxLength={50}
                                  error={!!groupNameErrors[group.groupId]}
                                />
                                <View style={styles.editActions}>
                                  <IconButton
                                    icon="check"
                                    size={20}
                                    iconColor="#16a34a"
                                    onPress={() => saveGroupName(group.groupId)}
                                  />
                                  <IconButton
                                    icon="close"
                                    size={20}
                                    iconColor="#dc2626"
                                    onPress={() => cancelEditingGroupName(group.groupId)}
                                  />
                                </View>
                              </View>
                            ) : (
                              <View style={styles.groupTitleRow}>
                                <TouchableOpacity
                                  onPress={() => toggleGroupExpansion(group.groupId)}
                                  style={styles.groupNameTouchable}
                                >
                                  <Ionicons 
                                    name={isExpanded ? "chevron-down" : "chevron-forward"} 
                                    size={16} 
                                    color="#6b7280" 
                                    style={styles.expandIcon}
                                  />
                                  <Text
                                    variant="titleMedium"
                                    style={styles.groupName}
                                  >
                                    {group.groupName}
                                  </Text>
                                </TouchableOpacity>
                                <IconButton
                                  icon="pencil"
                                  size={18}
                                  onPress={() => startEditingGroupName(group.groupId)}
                                  style={styles.editButton}
                                />
                                <IconButton
                                  icon="trash-can"
                                  size={20}
                                  iconColor="#ef4444"
                                  onPress={() => deleteGroup(group.groupId)}
                                />
                              </View>
                            )}
                            {groupNameErrors[group.groupId] && (
                              <Text variant="bodySmall" style={styles.errorText}>
                                {groupNameErrors[group.groupId]}
                              </Text>
                            )}
                            {/* Participant count on separate line */}
                            <View style={styles.participantCountRow}>
                              <Badge variant="default" size="sm">
                                {group.participants.length} participants
                              </Badge>
                            </View>
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            {/* Search bar for adding participants */}
                            {unassignedParticipants.length > 0 && (
                              <View style={styles.searchSection}>
                                <TextInput
                                  mode="outlined"
                                  label="Search participants to add"
                                  placeholder="Type name..."
                                  value={participantSearchQuery[group.groupId] || ''}
                                  onChangeText={(value) => handleParticipantSearch(group.groupId, value)}
                                  style={styles.searchInput}
                                  dense
                                />
                              </View>
                            )}

                            {/* Current participants */}
                            {group.participants.length > 0 && (
                              <View style={styles.currentParticipantsSection}>
                                <Text variant="labelMedium" style={styles.sectionTitle}>
                                  Current Participants
                                </Text>
                                <ScrollView style={styles.participantsScroll} nestedScrollEnabled>
                                  {group.participants.map((participant) => (
                                    <List.Item
                                      key={participant._id}
                                      title={getParticipantDisplayName(participant)}
                                      left={() => (
                                        <Avatar
                                          src={getParticipantImage(participant)}
                                          alt={getParticipantDisplayName(participant)}
                                          size={32}
                                        />
                                      )}
                                      right={() => (
                                        <IconButton
                                          icon="close-circle"
                                          size={18}
                                          iconColor="#ef4444"
                                          onPress={() => removeParticipantFromGroup(group.groupId, participant._id)}
                                        />
                                      )}
                                      style={styles.participantItem}
                                    />
                                  ))}
                                </ScrollView>
                              </View>
                            )}

                            {/* Available participants to add */}
                            {filteredParticipants.length > 0 && (
                              <View style={styles.availableParticipantsSection}>
                                <Text variant="labelMedium" style={styles.sectionTitle}>
                                  Available to Add ({filteredParticipants.length})
                                </Text>
                                <ScrollView style={styles.availableScroll} nestedScrollEnabled>
                                  {filteredParticipants.map((participant) => (
                                    <List.Item
                                      key={participant._id}
                                      title={getParticipantDisplayName(participant)}
                                      left={() => (
                                        <Avatar
                                          src={getParticipantImage(participant)}
                                          alt={getParticipantDisplayName(participant)}
                                          size={32}
                                        />
                                      )}
                                      right={() => <List.Icon icon="plus" />}
                                      onPress={() => addParticipantToGroup(group.groupId, participant)}
                                      style={styles.availableItem}
                                    />
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.unassignedContainer}>
              {/* Search for unassigned participants */}
              <TextInput
                mode="outlined"
                label="Search unassigned participants"
                placeholder="Type name or username..."
                value={unassignedSearchQuery}
                onChangeText={setUnassignedSearchQuery}
                style={styles.unassignedSearchInput}
              />

              {/* Unassigned Participants List */}
              <ScrollView style={styles.unassignedScroll} showsVerticalScrollIndicator={false}>
                {filteredUnassignedParticipants.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={48} color="#9ca3af" />
                    <Text variant="bodyMedium" style={styles.emptyStateText}>
                      {unassignedSearchQuery ? 'No participants found' : 'No unassigned participants'}
                    </Text>
                    <Text variant="bodySmall" style={styles.emptyStateSubText}>
                      {unassignedSearchQuery ? 'Try a different search term' : 'All participants are assigned to groups'}
                    </Text>
                  </View>
                ) : (
                  filteredUnassignedParticipants.map((participant) => (
                    <List.Item
                      key={participant._id}
                      title={getParticipantDisplayName(participant)}
                      description="Tap and hold to see group options"
                      left={() => (
                        <Avatar
                          src={getParticipantImage(participant)}
                          alt={getParticipantDisplayName(participant)}
                          size={36}
                        />
                      )}
                      style={styles.unassignedParticipantItem}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            style={styles.cancelButton} 
            onPress={onClose} 
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  content: {
    height: 500,
  },
  description: {
    color: "#64748b",
    marginBottom: 16,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  // Groups container
  groupsContainer: {
    flex: 1,
  },
  createGroupButton: {
    marginBottom: 16,
  },
  groupsList: {
    maxHeight: 350,
  },
  // Unassigned container
  unassignedContainer: {
    flex: 1,
  },
  unassignedSearchInput: {
    marginBottom: 16,
  },
  // Empty states
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 8,
  },
  emptyStateSubText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
  // Group card styles
  groupCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  groupTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandIcon: {
    marginRight: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  editButton: {
    marginLeft: 8,
  },
  participantCountRow: {
    marginTop: 4,
  },
  editGroupSection: {
    flex: 1,
  },
  groupNameInput: {
    backgroundColor: "white",
    marginBottom: 8,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  groupHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Expanded content styles
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "white",
  },
  currentParticipantsSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#374151",
    marginBottom: 8,
  },
  participantsScroll: {
    maxHeight: 120,
  },
  participantItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    marginBottom: 4,
  },
  availableParticipantsSection: {
    marginBottom: 8,
  },
  availableScroll: {
    maxHeight: 120,
  },
  availableItem: {
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  // Unassigned participants
  unassignedScroll: {
    maxHeight: 350,
  },
  unassignedParticipantItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    marginBottom: 4,
  },
  // Dialog actions
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    borderRadius: 6,
  },
});

