import { Box, Chip, Typography, useTheme, alpha } from "@mui/material";
import {
  CategoryOutlined,
  PlaceOutlined,
  NearMeOutlined,
  EventAvailableOutlined,
  NotesOutlined,
  TagOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { REASON_LABEL_KEYS, TIER_LABEL_KEYS, getTierTone } from "./matchDisplay";

/**
 * The two small presentational pieces every match surface shares: the
 * confidence badge and the "why we paired these" reason chips.
 *
 * Both are read-only and token-driven (theme.custom.*), and both use CSS
 * logical properties so they flip with the document direction in Arabic.
 */

const REASON_ICONS = {
  same_category: CategoryOutlined,
  same_city: PlaceOutlined,
  nearby_location: NearMeOutlined,
  close_dates: EventAvailableOutlined,
  similar_description: NotesOutlined,
  shared_reference: TagOutlined,
};

/**
 * Confidence band + score. The band is the label; the percentage rides along as
 * secondary text because a number alone ("62") tells a reader nothing.
 */
export const ConfidenceBadge = ({ tier, score, size = "medium" }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = getTierTone(theme, tier);
  const isSmall = size === "small";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        paddingInline: isSmall ? 1 : 1.25,
        paddingBlock: isSmall ? 0.25 : 0.5,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: tone.bg,
        flexShrink: 0,
      }}
    >
      <VerifiedOutlined sx={{ fontSize: isSmall ? 14 : 16, color: tone.main }} />
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: isSmall ? "0.7rem" : "0.78rem",
          color: tone.main,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {t(TIER_LABEL_KEYS[tier] || TIER_LABEL_KEYS.possible)}
        {typeof score === "number" ? ` · ${score}%` : ""}
      </Typography>
    </Box>
  );
};

/**
 * Every signal that contributed to the pairing, as chips. Showing the reasons
 * is what makes an automated alert trustworthy - a bare "possible match" with
 * no explanation reads as a guess.
 */
export const MatchReasons = ({ reasons = [], max = 6 }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const known = reasons.filter((reason) => REASON_LABEL_KEYS[reason]).slice(0, max);
  if (known.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {known.map((reason) => {
        const Icon = REASON_ICONS[reason];
        return (
          <Chip
            key={reason}
            size="small"
            icon={Icon ? <Icon sx={{ fontSize: 14 }} /> : undefined}
            label={t(REASON_LABEL_KEYS[reason])}
            sx={{
              height: 24,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.custom.color.ink, 0.06),
              color: theme.custom.color.ink,
              fontSize: "0.72rem",
              fontWeight: 600,
              "& .MuiChip-icon": {
                color: theme.custom.color.brandPrimary,
                marginInlineStart: "6px",
                marginInlineEnd: "-2px",
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default MatchReasons;
