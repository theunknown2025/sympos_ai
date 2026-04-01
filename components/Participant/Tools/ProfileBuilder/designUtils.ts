import { ProfileDesign } from '../../../../services/profileBuilderService';

export interface DesignStyles {
  background?: React.CSSProperties;
  banner?: React.CSSProperties;
  tabs?: {
    button?: React.CSSProperties;
    activeButton?: React.CSSProperties;
    hoverButton?: React.CSSProperties;
  };
  titles?: React.CSSProperties;
  subtitles?: React.CSSProperties;
  dates?: React.CSSProperties;
  links?: React.CSSProperties;
  borders?: React.CSSProperties;
  section?: (sectionId: string) => React.CSSProperties;
}

export const generateDesignStyles = (design: ProfileDesign | undefined): DesignStyles => {
  if (!design) {
    return {};
  }

  const styles: DesignStyles = {};

  // Background styles
  if (design.background) {
    if (design.background.type === 'color' && design.background.color) {
      styles.background = { backgroundColor: design.background.color };
    } else if (design.background.type === 'gradient' && design.background.gradient) {
      const { from, to, direction = 'to right' } = design.background.gradient;
      styles.background = {
        background: `linear-gradient(${direction}, ${from || '#ffffff'}, ${to || '#ffffff'})`,
      };
    } else if (design.background.type === 'image' && design.background.image) {
      styles.background = {
        backgroundImage: `url(${design.background.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  // Banner styles
  if (design.banner) {
    if (design.banner.type === 'color' && design.banner.color) {
      styles.banner = { backgroundColor: design.banner.color };
    } else if (design.banner.type === 'gradient' && design.banner.gradient) {
      const { from, to, direction = 'to right' } = design.banner.gradient;
      styles.banner = {
        background: `linear-gradient(${direction}, ${from || '#ffffff'}, ${to || '#ffffff'})`,
      };
    } else if (design.banner.type === 'image' && design.banner.image) {
      styles.banner = {
        backgroundImage: `url(${design.banner.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  // Tab styles
  if (design.colors?.tabs) {
    styles.tabs = {};
    if (design.colors.tabs.main) {
      styles.tabs.button = { backgroundColor: design.colors.tabs.main };
    }
    if (design.colors.tabs.active) {
      styles.tabs.activeButton = {
        backgroundColor: design.colors.tabs.active,
        borderBottomColor: design.colors.tabs.active,
      };
    }
    if (design.colors.tabs.hover) {
      styles.tabs.hoverButton = { backgroundColor: design.colors.tabs.hover };
    }
    if (design.colors.tabs.text) {
      styles.tabs.button = {
        ...styles.tabs.button,
        color: design.colors.tabs.text,
      };
      styles.tabs.activeButton = {
        ...styles.tabs.activeButton,
        color: design.colors.tabs.text,
      };
    }
  }

  // Component color styles
  if (design.colors) {
    if (design.colors.titles) {
      styles.titles = { color: design.colors.titles };
    }
    if (design.colors.subtitles) {
      styles.subtitles = { color: design.colors.subtitles };
    }
    if (design.colors.dates) {
      styles.dates = { color: design.colors.dates };
    }
    if (design.colors.links) {
      styles.links = { color: design.colors.links };
    }
    if (design.colors.borders) {
      styles.borders = { borderColor: design.colors.borders };
    }
  }

  // Section-specific styles
  if (design.sections) {
    styles.section = (sectionId: string) => {
      const sectionDesign = design.sections?.[sectionId];
      if (!sectionDesign) return {};
      return {
        ...(sectionDesign.backgroundColor && { backgroundColor: sectionDesign.backgroundColor }),
        ...(sectionDesign.textColor && { color: sectionDesign.textColor }),
        ...(sectionDesign.borderColor && { borderColor: sectionDesign.borderColor }),
      };
    };
  }

  return styles;
};
