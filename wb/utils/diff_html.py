from html import escape, unescape

import lxml.etree
from xmldiff import formatting
from xmldiff import main as xml_diff

__all__ = ('diff_html',)

XSLT = """<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
   xmlns:diff="http://namespaces.shoobx.com/diff"
   xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
   <xsl:template match="@diff:insert-formatting">
       <xsl:attribute name="class">
         <xsl:value-of select="'insert-formatting'"/>
       </xsl:attribute>
   </xsl:template>
   <xsl:template match="diff:delete">
       <del><xsl:apply-templates /></del>
   </xsl:template>
   <xsl:template match="diff:insert">
      <ins><xsl:apply-templates /></ins>
   </xsl:template>
   <xsl:template match="@* | node()">
      <xsl:copy>
      <xsl:apply-templates select="@* | node()"/>
      </xsl:copy>
   </xsl:template>
</xsl:stylesheet>"""


class HTMLFormatter(formatting.XMLFormatter):
    def render(self, result):
        transform = lxml.etree.XSLT(lxml.etree.XML(XSLT))
        result = transform(result)
        return super().render(result)


def _pre(html: str) -> str:
    return f'<html>{escape(html)}</html>'


def _post(html: str) -> str:
    def _strip_html_tag(s: str) -> str:
        return s[s.find('>') + 1 : s.rfind('<')]

    return unescape(_strip_html_tag(html.strip()))


def diff_html(html1: str, html2: str) -> str:
    return _post(
        xml_diff.diff_texts(
            _pre(html1),
            _pre(html2),
            diff_options={'fast_match': True},
            formatter=HTMLFormatter(normalize=formatting.WS_BOTH),
        )
    )
