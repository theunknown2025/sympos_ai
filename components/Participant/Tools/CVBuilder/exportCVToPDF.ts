import jsPDF from 'jspdf';
import { CV } from '../../../../services/cvService';

export const exportCVToPDF = async (cv: Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak(7);
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });
    
    yPosition += 3; // Add spacing after text
  };

  // Add profile image if available
  if (cv.profileImage) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = cv.profileImage;
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const imgWidth = 40;
            const imgHeight = 40;
            const imgX = pageWidth - margin - imgWidth;
            doc.addImage(img, 'PNG', imgX, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
            resolve(null);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
      });
    } catch (error) {
      console.error('Error loading profile image:', error);
      // Continue without image
    }
  }

  // Process sections in order
  const sortedSections = cv.sections.sort((a, b) => a.order - b.order);

  sortedSections.forEach((section) => {
    checkPageBreak(15);

    switch (section.type) {
      case 'title':
        addText(section.data.title || 'Your Name', 24, true, [30, 41, 59]);
        if (section.data.subtitle) {
          addText(section.data.subtitle, 14, false, [100, 116, 139]);
        }
        yPosition += 5;
        break;

      case 'generalInfo':
        addText('Contact Information', 16, true, [30, 41, 59]);
        yPosition -= 3;
        if (section.data.email) {
          addText(`Email: ${section.data.email}`, 10, false, [51, 65, 85]);
        }
        if (section.data.phone) {
          addText(`Phone: ${section.data.phone}`, 10, false, [51, 65, 85]);
        }
        if (section.data.address) {
          addText(`Address: ${section.data.address}`, 10, false, [51, 65, 85]);
        }
        if (section.data.links && section.data.links.length > 0) {
          section.data.links.forEach((link: any) => {
            const platformLabel = link.platform === 'linkedin' ? 'LinkedIn' :
                                 link.platform === 'github' ? 'GitHub' :
                                 link.platform === 'gitlab' ? 'GitLab' :
                                 link.platform === 'google-scholar' ? 'Google Scholar' :
                                 link.platform === 'orcid' ? 'ORCID' :
                                 link.platform === 'researchgate' ? 'ResearchGate' :
                                 link.platform === 'twitter' ? 'Twitter/X' :
                                 link.platform === 'website' ? 'Website' :
                                 link.platform || 'Link';
            addText(`${platformLabel}: ${link.url}`, 10, false, [51, 65, 85]);
          });
        }
        yPosition += 5;
        break;

      case 'profile':
        addText('Profile', 16, true, [30, 41, 59]);
        yPosition -= 3;
        if (section.data.content) {
          addText(section.data.content, 10, false, [51, 65, 85]);
        }
        yPosition += 5;
        break;

      case 'professionalExperience':
        addText('Professional Experience', 16, true, [30, 41, 59]);
        yPosition -= 3;
        
        section.data.experiences?.forEach((exp: any) => {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(exp.position || 'Position', margin, yPosition);
          
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(exp.company || 'Company', margin, yPosition);
          
          if (exp.startDate || exp.endDate) {
            const dateText = `${exp.startDate || ''} - ${exp.endDate || 'Present'}`;
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
          }
          
          yPosition += 6;
          if (exp.description) {
            addText(exp.description, 10, false, [51, 65, 85]);
          }
          yPosition += 5;
        });
        break;

      case 'education':
        addText('Education', 16, true, [30, 41, 59]);
        yPosition -= 3;
        
        section.data.educations?.forEach((edu: any) => {
          checkPageBreak(15);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          const degreeText = `${edu.degree || 'Degree'}${edu.field ? ` in ${edu.field}` : ''}`;
          doc.text(degreeText, margin, yPosition);
          
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(edu.institution || 'Institution', margin, yPosition);
          
          if (edu.startDate || edu.endDate) {
            const dateText = `${edu.startDate || ''} - ${edu.endDate || 'Present'}`;
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
          }
          
          yPosition += 10;
        });
        break;

      case 'skills':
        addText('Skills', 16, true, [30, 41, 59]);
        yPosition -= 3;
        if (section.data.skills?.length > 0) {
          const skillsText = section.data.skills
            .map((skill: any) => `${skill.name}${skill.proficiency ? ` (${skill.proficiency})` : ''}`)
            .join(', ');
          addText(skillsText, 10, false, [51, 65, 85]);
        }
        yPosition += 5;
        break;

      case 'languageSkills':
        addText('Language Skills', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.languages?.forEach((lang: any) => {
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          const langText = `${lang.name || 'Language'}: ${lang.proficiency || ''}`;
          doc.text(langText, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
        break;

      case 'certificatesCourses':
        addText('Certificates & Courses', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.certificates?.forEach((cert: any) => {
          checkPageBreak(15);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(cert.name || 'Certificate', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(cert.issuer || 'Issuer', margin, yPosition);
          if (cert.date) {
            const dateWidth = doc.getTextWidth(cert.date);
            doc.text(cert.date, pageWidth - margin - dateWidth, yPosition);
          }
          yPosition += 8;
        });
        break;

      case 'projects':
        addText('Projects', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.projects?.forEach((project: any) => {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(project.name || 'Project', margin, yPosition);
          if (project.startDate || project.endDate) {
            const dateText = `${project.startDate || ''} - ${project.endDate || 'Present'}`;
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
          }
          yPosition += 6;
          if (project.technologies) {
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Technologies: ${project.technologies}`, margin, yPosition);
            yPosition += 5;
          }
          if (project.description) {
            addText(project.description, 10, false, [51, 65, 85]);
          }
          yPosition += 5;
        });
        break;

      case 'volunteering':
        addText('Volunteering Experience', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.volunteerings?.forEach((vol: any) => {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(vol.role || 'Role', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(vol.organization || 'Organization', margin, yPosition);
          if (vol.startDate || vol.endDate) {
            const dateText = `${vol.startDate || ''} - ${vol.endDate || 'Present'}`;
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
          }
          yPosition += 6;
          if (vol.description) {
            addText(vol.description, 10, false, [51, 65, 85]);
          }
          yPosition += 5;
        });
        break;

      case 'publications':
        addText('Publications', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.publications?.forEach((pub: any) => {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(pub.title || 'Publication', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          if (pub.authors) {
            doc.text(`Authors: ${pub.authors}`, margin, yPosition);
            yPosition += 5;
          }
          doc.text(pub.publisher || 'Publisher', margin, yPosition);
          if (pub.date) {
            const dateWidth = doc.getTextWidth(pub.date);
            doc.text(pub.date, pageWidth - margin - dateWidth, yPosition);
          }
          yPosition += 5;
          if (pub.description) {
            addText(pub.description, 9, false, [51, 65, 85]);
          }
          yPosition += 5;
        });
        break;

      case 'references':
        addText('References', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.references?.forEach((ref: any) => {
          checkPageBreak(18);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(ref.name || 'Reference', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`${ref.position || 'Position'} at ${ref.company || 'Company'}`, margin, yPosition);
          yPosition += 5;
          if (ref.email) {
            doc.text(`Email: ${ref.email}`, margin, yPosition);
            yPosition += 5;
          }
          if (ref.phone) {
            doc.text(`Phone: ${ref.phone}`, margin, yPosition);
            yPosition += 5;
          }
          if (ref.relationship) {
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`(${ref.relationship})`, margin, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        });
        break;

      case 'additionalInfo':
        addText('Additional Information', 16, true, [30, 41, 59]);
        yPosition -= 3;
        if (section.data.content) {
          addText(section.data.content, 10, false, [51, 65, 85]);
        }
        yPosition += 5;
        break;

      case 'externalProfiles':
        addText('External Profiles', 16, true, [30, 41, 59]);
        yPosition -= 3;
        section.data.profiles?.forEach((profile: any) => {
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          const profileText = `${profile.platform || 'Platform'}${profile.username ? ` (${profile.username})` : ''}`;
          doc.text(profileText, margin, yPosition);
          if (profile.url) {
            const urlText = profile.url.length > 50 ? profile.url.substring(0, 47) + '...' : profile.url;
            doc.setFontSize(9);
            doc.setTextColor(99, 102, 241);
            doc.text(urlText, margin + 60, yPosition);
          }
          yPosition += 6;
        });
        yPosition += 3;
        break;
    }
  });

  // Save the PDF
  doc.save(`${cv.title || 'CV'}.pdf`);
};
