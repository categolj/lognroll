package am.ik.lognroll.logs.query;

import java.util.stream.Collectors;

import am.ik.query.Query;
import am.ik.query.ast.AndNode;
import am.ik.query.ast.FieldNode;
import am.ik.query.ast.FuzzyNode;
import am.ik.query.ast.Node;
import am.ik.query.ast.NodeVisitor;
import am.ik.query.ast.NotNode;
import am.ik.query.ast.OrNode;
import am.ik.query.ast.PhraseNode;
import am.ik.query.ast.RangeNode;
import am.ik.query.ast.RootNode;
import am.ik.query.ast.TokenNode;
import am.ik.query.ast.WildcardNode;
import am.ik.query.parser.QueryParser;

public class Sqlite3QueryConverter implements NodeVisitor<String> {

	private static final QueryParser PARSER = QueryParser.create();

	public static String convertQuery(String query) {
		Query parsed = PARSER.parse(query);
		if (parsed.isEmpty()) {
			return "";
		}
		return parsed.accept(new Sqlite3QueryConverter());
	}

	@Override
	public String visitRoot(RootNode node) {
		return node.children()
			.stream()
			.map(child -> child.accept(this))
			.filter(s -> !s.isEmpty())
			.collect(Collectors.joining(" AND "));
	}

	@Override
	public String visitAnd(AndNode node) {
		return node.children()
			.stream()
			.map(child -> child.accept(this))
			.filter(s -> !s.isEmpty())
			.collect(Collectors.joining(" AND "));
	}

	@Override
	public String visitOr(OrNode node) {
		String result = node.children()
			.stream()
			.map(child -> child.accept(this))
			.filter(s -> !s.isEmpty())
			.collect(Collectors.joining(" OR "));
		return "(" + result + ")";
	}

	@Override
	public String visitNot(NotNode node) {
		Node child = node.child();
		if (child instanceof TokenNode tokenNode) {
			return "NOT \"" + tokenNode.value() + "\"";
		}
		String childResult = child.accept(this);
		return childResult.isEmpty() ? "" : "NOT (" + childResult + ")";
	}

	@Override
	public String visitToken(TokenNode node) {
		return "\"" + node.value() + "\"";
	}

	@Override
	public String visitPhrase(PhraseNode node) {
		return "\"" + node.phrase() + "\"";
	}

	@Override
	public String visitWildcard(WildcardNode node) {
		return "\"" + node.value() + "\"";
	}

	@Override
	public String visitFuzzy(FuzzyNode node) {
		return "\"" + node.value() + "\"";
	}

	@Override
	public String visitField(FieldNode node) {
		return node.field() + ":\"" + node.value() + "\"";
	}

	@Override
	public String visitRange(RangeNode node) {
		return "";
	}

}
