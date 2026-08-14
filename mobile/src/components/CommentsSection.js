/**
 * The post's comment thread: comments written in the app, interleaved by time
 * with the ones left on the auto-posted Facebook/Instagram copies.
 * Mirrors: client/src/features/posts/PostPage/CommentsSection.jsx
 *
 * The merge happens server-side (server/controllers/commentsController.js);
 * this renders it. The rule that shapes the component is that the two kinds
 * never blur together: a site comment comes from an account that can be
 * moderated, a Facebook comment comes from a stranger on someone else's
 * platform. Someone deciding whether to trust a lead about their lost
 * property needs to know which they are reading, so the source stays visible
 * on every borrowed comment.
 *
 * Replying to a social comment is deliberately not offered - the only way to
 * post one would be through the Page token, which would publish the user's
 * words as the Mafqoudat Page itself.
 *
 * Phase 9 applies: the parent card is borderless and shadowless, the small
 * source badges carry the sub-element shadow.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { row, alignStart } from '../utils/rtl';
import { formatRelativeTime } from '../utils/relativeTime';
import { fetchComments, addComment, deleteComment, reportComment } from '../api/commentsApi';

// Meta's own brand colors - same documented exception to the token rule as
// SocialReach.js, for the same reason: these mark content that belongs to
// their platforms, not ours.
const SOURCE_META = {
  facebook: { icon: 'logo-facebook', tint: '#1877F2', labelKey: 'commentFromFacebook' },
  instagram: { icon: 'logo-instagram', tint: '#E1306C', labelKey: 'commentFromInstagram' },
};

// How many more comments each "load more" reveals. The server merges and
// re-sorts the whole thread, so a later page is not stable enough to append
// to blindly - growing the first page is what keeps the list correct when a
// comment arrives between two requests.
const PAGE_STEP = 20;

// Matches the server's own cap on a comment body.
const MAX_COMMENT_LENGTH = 1000;

const getElevation = (isDark, level) => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: level },
  shadowOpacity: isDark ? 0.4 : 0.08,
  shadowRadius: level * 2,
  elevation: level,
});

const CommentRow = ({ comment, styles, tokens, t, currentLanguage, onDelete, onReport }) => {
  const source = SOURCE_META[comment.source];
  // A borrowed comment with no readable author name still says something
  // worth showing - it just cannot say who said it.
  const displayName = comment.author?.username || (source ? t('unknownCommenter') : t('unknownUser'));

  const showActions = () => {
    const options = [];
    if (comment.canDelete) {
      options.push({
        text: t('deleteComment'),
        style: 'destructive',
        onPress: () => onDelete(comment),
      });
    }
    if (comment.canReport) {
      options.push({ text: t('reportComment'), onPress: () => onReport(comment) });
    }
    if (options.length === 0) return;
    Alert.alert('', '', [...options, { text: t('cancel'), style: 'cancel' }]);
  };

  return (
    <View style={styles.commentRow}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: source ? `${source.tint}1F` : `${tokens.brandPrimary}1F` },
        ]}
      >
        <Text style={[styles.avatarText, { color: source ? source.tint : tokens.brandPrimary }]}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor} numberOfLines={1}>{displayName}</Text>

          {source ? (
            <View style={[styles.sourceBadge, { backgroundColor: `${source.tint}1A` }]}>
              <Ionicons name={source.icon} size={11} color={source.tint} />
              <Text style={[styles.sourceBadgeText, { color: source.tint }]}>
                {t(source.labelKey)}
              </Text>
            </View>
          ) : null}

          {comment.createdAt ? (
            <Text style={styles.commentTime}>
              {formatRelativeTime(comment.createdAt, t, currentLanguage)}
            </Text>
          ) : null}

          {comment.canDelete || comment.canReport ? (
            <TouchableOpacity onPress={showActions} style={styles.commentMenuButton} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={16} color={`${tokens.ink}80`} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
};

const CommentsSection = ({ postId }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const load = useCallback(async (count) => {
    try {
      const data = await fetchComments(postId, { page: 1, pageSize: count });
      setComments(data?.comments || []);
      setTotal(data?.total || 0);
      setHasFailed(false);
    } catch (error) {
      setHasFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load(visibleCount);
  }, [load, visibleCount]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isPosting) return;

    setIsPosting(true);
    try {
      await addComment(postId, trimmed);
      setText('');
      await load(visibleCount);
    } catch (error) {
      Alert.alert('', t('commentFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = (comment) => {
    Alert.alert('', t('deleteCommentConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteComment'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(postId, comment.id);
            await load(visibleCount);
          } catch (error) {
            Alert.alert('', t('commentFailed'));
          }
        },
      },
    ]);
  };

  const handleReport = async (comment) => {
    try {
      await reportComment(postId, comment.id, { reason: 'Reported from the post screen' });
      Alert.alert('', t('commentReported'));
    } catch (error) {
      Alert.alert('', t('commentFailed'));
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="chatbubble-outline" size={18} color={tokens.ink} />
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('commentsTitle')}</Text>
        {total > 0 ? (
          <Text style={styles.sectionCount}>{t('commentsCount', { count: total })}</Text>
        ) : null}
      </View>

      {isSignedIn ? (
        /* Field on its own row, action beneath it: a square send button
           squeezed beside a multiline field left the input too narrow for the
           placeholder to fit and gave the primary action of the section no
           label. Stacked, the field gets the full width and the button gets
           its words back. */
        <View style={styles.composer}>
          <TextInput
            style={[styles.input, isRTL && styles.textRTL]}
            value={text}
            onChangeText={setText}
            placeholder={t('commentPlaceholder')}
            placeholderTextColor={`${tokens.ink}66`}
            multiline
            maxLength={MAX_COMMENT_LENGTH}
          />
          <View style={styles.composerFooter}>
            <Text style={styles.counter}>
              {text.length > 0 ? `${text.length}/${MAX_COMMENT_LENGTH}` : ''}
            </Text>
            <TouchableOpacity
              style={[styles.sendButton, (!text.trim() || isPosting) && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!text.trim() || isPosting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('postComment')}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={15} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>{t('postComment')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.signInNote, isRTL && styles.textRTL]}>{t('signInToComment')}</Text>
      )}

      {isLoading ? (
        <ActivityIndicator size="small" color={tokens.brandPrimary} style={styles.loader} />
      ) : hasFailed ? (
        <Text style={[styles.emptyText, isRTL && styles.textRTL]}>{t('commentFailed')}</Text>
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t('noCommentsYet')}</Text>
          <Text style={[styles.emptyText, isRTL && styles.textRTL]}>{t('beFirstToComment')}</Text>
        </View>
      ) : (
        <>
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              styles={styles}
              tokens={tokens}
              t={t}
              currentLanguage={currentLanguage}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          ))}

          {comments.length < total ? (
            <TouchableOpacity
              onPress={() => setVisibleCount((current) => current + PAGE_STEP)}
              style={styles.loadMore}
              activeOpacity={0.7}
            >
              <Text style={styles.loadMoreText}>{t('loadMoreComments')}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
};

const createStyles = ({ tokens, isDark, isRTL }) => StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: tokens.ink,
  },
  sectionCount: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: `${tokens.ink}99`,
  },
  composer: {
    padding: 12,
    borderRadius: radiusTokens.md,
    backgroundColor: `${tokens.ink}0A`,
    marginBottom: 8,
  },
  input: {
    minHeight: 66,
    maxHeight: 160,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: radiusTokens.sm,
    backgroundColor: tokens.surfaceRaised,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.ink,
    textAlign: isRTL ? 'right' : 'left',
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  counter: {
    flexShrink: 1,
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: `${tokens.ink}66`,
  },
  sendButton: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radiusTokens.md,
    backgroundColor: tokens.brandPrimary,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  signInNote: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: `${tokens.ink}99`,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: tokens.ink,
  },
  emptyText: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: `${tokens.ink}99`,
    textAlign: 'center',
  },
  commentRow: {
    flexDirection: row(isRTL),
    gap: 10,
    paddingVertical: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentHeader: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  commentAuthor: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: tokens.ink,
    flexShrink: 1,
  },
  sourceBadge: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radiusTokens.sm,
    ...getElevation(isDark, 1),
  },
  sourceBadgeText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 10,
  },
  commentTime: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: `${tokens.ink}80`,
  },
  commentMenuButton: {
    marginStart: 'auto',
    padding: 2,
  },
  commentText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
    color: `${tokens.ink}CC`,
    marginTop: 3,
    textAlign: isRTL ? 'right' : 'left',
  },
  loadMore: {
    alignSelf: alignStart(isRTL),
    paddingVertical: 8,
  },
  loadMoreText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: tokens.brandPrimary,
  },
  textRTL: {
    writingDirection: 'rtl',
  },
});

export default CommentsSection;
