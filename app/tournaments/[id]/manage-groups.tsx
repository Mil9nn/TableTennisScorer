import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  List,
  TextInput,
  Appbar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
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
import { DesignTokens } from "@/constants/designTokens";

export default function ManageGroupsPage() {
  const router = useRouter();
  const { id: tournamentId, groups: groupsParam, participants: participantsParam } = useLocalSearchParams<{
    id: string;
    groups?: string;
    participants?: string;
  }>();

  // Parse data from navigation params
  const initialGroups = useMemo(() => groupsParam ? JSON.parse(groupsParam) : [], [groupsParam]);
  const initialParticipants = useMemo(() => participantsParam ? JSON.parse(participantsParam) : [], [participantsParam]);

  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedGroupNames, setEditedGroupNames] = useState<Record<string, string>>({});
  const [groupNameErrors, setGroupNameErrors] = useState<Record<string, string>>({});
  const [numberOfGroups] = useState(26); // Maximum number of groups allowed
  const [activeTab, setActiveTab] = useState<'groups' | 'unassigned'>('groups');
  const [participantSearchQuery, setParticipantSearchQuery] = useState<Record<string, string>>({});

  // Initialize edited names with current group names
  useEffect(() => {
    const initialNames: Record<string, string> = {};
    initialGroups.forEach((group: Group) => {
      initialNames[group.groupId] = group.groupName;
    });
    setEditedGroupNames(initialNames);
  }, [initialGroups]);

  // Get all participants currently assigned to groups
  const getAssignedParticipantIds = useMemo(() => {
    return () => {
      const assigned = new Set<string>();
      groups.forEach((group) => {
        group.participants.forEach((p) => {
          assigned.add(p._id);
        });
      });
      return assigned;
    };
  }, [groups]);

  // Get unassigned participants
  const getUnassignedParticipants = useMemo(() => {
    return () => {
      const assigned = getAssignedParticipantIds();
      return participants.filter((p) => !assigned.has(p._id));
    };
  }, [getAssignedParticipantIds, participants]);

  // Add participant to a group
  const addParticipantToGroup = (groupId: string, participant: Participant) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          // Check if participant is already in this group
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

  // Remove participant from a group
  const removeParticipantFromGroup = (
    groupId: string,
    participantId: string
  ) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          return {
            ...group,
            participants: group.participants.filter(
              (p) => p._id !== participantId
            ),
          };
        }
        return group;
      })
    );
  };

  // Create a new group
  const createNewGroup = () => {
    // Check if we've reached the configured number of groups
    if (numberOfGroups && groups.length >= numberOfGroups) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Maximum number of groups reached (${numberOfGroups}).`,
      });
      return;
    }

    const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existingGroupIds = new Set(groups.map((g) => g.groupId));
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

    setGroups((prev) => [
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
    const duplicate = groups.find(
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
    const group = groups.find((g) => g.groupId === groupId);
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
    const group = groups.find((g) => g.groupId === groupId);
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

    // Update the group name in groups
    const trimmedName = editedName.trim();
    setGroups((prev) =>
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



  // Get filtered participants for a specific group search
  const getFilteredParticipantsForGroup = useMemo(() => {
    return (groupId: string) => {
      const unassigned = getUnassignedParticipants();
      const query = participantSearchQuery[groupId] || '';
      if (!query.trim()) return unassigned;
      const lowerQuery = query.toLowerCase();
      return unassigned.filter(p =>
        getParticipantDisplayName(p).toLowerCase().includes(lowerQuery)
      );
    };
  }, [getUnassignedParticipants, participantSearchQuery]);

  // Get username for display (prioritizes username over fullName)
  const getParticipantUsername = (participant: Participant): string => {
    if (isTeamParticipant(participant)) {
      return participant.name || "Unknown Team";
    }
    return participant.username || participant.fullName || "Unknown";
  };

  // Handle participant search for a group
  const handleParticipantSearch = (groupId: string, query: string) => {
    setParticipantSearchQuery(prev => ({
      ...prev,
      [groupId]: query,
    }));
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.groupId === groupId);
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
            setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
          },
        },
      ]
    );
  };

  // Save changes
  const handleSave = async () => {
    // Validate all group names before saving
    const validationErrors: Record<string, string> = {};
    for (const group of groups) {
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
      const groupsData = groups.map((group) => ({
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

      setGroups(data.tournament.groups);
      router.back();
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

  const unassignedParticipants = useMemo(() => getUnassignedParticipants(), [getUnassignedParticipants]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.compactHeader}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.chevronButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.smallTitle}>Manage Groups</Text>
        </View>
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          iconColor="#2563eb"
        />
      </Appbar.Header>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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
                Groups ({groups.length})
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
                disabled={groups.length >= numberOfGroups}
              >
                Create New Group
              </Button>

              {groups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text variant="titleMedium" style={styles.emptyStateText}>
                    No groups yet
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyStateSubText}>
                    Create your first group to start organizing participants
                  </Text>
                </View>
              ) : (
                groups.map((group) => {
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
                              <Text
                                variant="titleMedium"
                                style={styles.groupName}
                              >
                                {group.groupName}
                              </Text>
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

                      {true && (
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
                              <View style={styles.currentParticipantsGrid}>
                                {group.participants.map((participant) => (
                                  <TouchableOpacity
                                    key={participant._id}
                                    onPress={() => removeParticipantFromGroup(group.groupId, participant._id)}
                                    style={styles.currentParticipantCard}
                                  >
                                    <View style={styles.participantCardRow}>
                                      <Avatar
                                        src={getParticipantImage(participant)}
                                        alt={getParticipantDisplayName(participant)}
                                        size={20}
                                      />
                                      <Text variant="bodySmall" style={styles.participantName} numberOfLines={1}>
                                        {getParticipantUsername(participant)}
                                      </Text>
                                      <Ionicons name="remove-circle" size={14} color="#ef4444" style={styles.removeIcon} />
                                    </View>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Available participants to add */}
                          {filteredParticipants.length > 0 && (
                            <View style={styles.availableParticipantsSection}>
                              <Text variant="labelMedium" style={styles.sectionTitle}>
                                Available to Add ({filteredParticipants.length})
                              </Text>
                              <View style={styles.availableParticipantsGrid}>
                                {filteredParticipants.map((participant) => (
                                  <TouchableOpacity
                                    key={participant._id}
                                    onPress={() => addParticipantToGroup(group.groupId, participant)}
                                    style={styles.availableParticipantCard}
                                  >
                                    <View style={styles.participantCardRow}>
                                      <Avatar
                                        src={getParticipantImage(participant)}
                                        alt={getParticipantDisplayName(participant)}
                                        size={20}
                                      />
                                      <Text variant="bodySmall" style={styles.participantName} numberOfLines={1}>
                                        {getParticipantUsername(participant)}
                                      </Text>
                                      <Ionicons name="add-circle" size={14} color="#16a34a" style={styles.addIcon} />
                                    </View>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.unassignedContainer}>
              {/* Unassigned Participants List */}
              <ScrollView style={styles.unassignedScroll} showsVerticalScrollIndicator={false}>
                {unassignedParticipants.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={48} color="#9ca3af" />
                    <Text variant="titleMedium" style={styles.emptyStateText}>
                      No unassigned participants
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptyStateSubText}>
                      All participants are assigned to groups
                    </Text>
                  </View>
                ) : (
                  unassignedParticipants.map((participant) => (
                    <List.Item
                      key={participant._id}
                      title={() => (
                        <Text style={styles.participantTitle}>
                          {getParticipantDisplayName(participant)}
                        </Text>
                      )}
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainScroll: {
    flex: 1,
  },
  compactHeader: {
    height: 48,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronButton: {
    marginRight: 8,
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    color: "#64748b",
    marginBottom: DesignTokens.spacing[4],
    textAlign: 'center',
    fontSize: 12,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: DesignTokens.spacing[6],
  },
  tab: {
    flex: 1,
    padding: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
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
    borderRadius: DesignTokens.borderRadius.sm,
    marginBottom: DesignTokens.spacing[4],
  },
  // Unassigned container
  unassignedContainer: {
    flex: 1,
  },
  // Empty states
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  // Group card styles
  groupCard: {
    marginBottom: DesignTokens.spacing[10],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.background.tertiary,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
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
    marginTop: 8,
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
  // Expanded content styles
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "white",
  },
  currentParticipantsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#374151",
    marginBottom: 12,
    fontWeight: '500',
  },
  participantItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 6,
  },
  availableParticipantsSection: {
    marginBottom: 12,
  },
  availableItem: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  availableParticipantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  availableParticipantCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 32,
  },
  participantCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantName: {
    fontSize: 9,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  addIcon: {
    marginLeft: 2,
  },
  currentParticipantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  currentParticipantCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 32,
  },
  removeIcon: {
    marginLeft: 2,
  },
  // Unassigned participants
  unassignedScroll: {
    flex: 1,
  },
  unassignedParticipantItem: {
    backgroundColor: DesignTokens.colors.background.secondary,
    borderRadius: DesignTokens.borderRadius.sm,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[1],
    marginBottom: DesignTokens.spacing[2],
  },
  participantTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: "#111827",
  },
});
